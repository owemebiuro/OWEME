"use server";

import {
  AttachmentType,
  ClaimSource,
  ClaimStatus,
  ClaimType,
  LeadStatus,
  type Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createClaimWithHistoryInTransaction,
  createManualFlight,
  getOrCreateSystemUser,
} from "@/lib/claims/create-claim";
import { sendInngestEvent } from "@/lib/inngest/events";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import { uploadObject, getStorageKey } from "@/lib/storage/r2";
import { emitEvent } from "@/src/server/events";

const flightNumberPattern = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i;
const airportCodePattern = /^[A-Z]{3}$/i;

const nonEmptyString = (message: string) =>
  z.string().trim().min(1, { message });

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional();

const optionalPesel = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => !value || /^\d{11}$/.test(value), {
    message: "PESEL musi zawierać 11 cyfr.",
  })
  .transform((value) => value || undefined)
  .optional();

function normalizeFlightNumber(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeAirportCode(value: string) {
  return value.trim().toUpperCase();
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Nieprawidłowy format załącznika.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function estimatedAmountFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>).SZACOWANA_KWOTA_EUR;
  const amount = typeof value === "string" ? Number(value) : value;

  return typeof amount === "number" && Number.isFinite(amount) ? amount : null;
}

function isPastFlightDate(value: string) {
  const flightDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(flightDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 3);

  return flightDate < today && flightDate >= minDate;
}

const passengerSchema = z.object({
  firstName: nonEmptyString("Podaj imię pasażera."),
  lastName: nonEmptyString("Podaj nazwisko pasażera."),
});

const applicationFileSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().positive().max(8 * 1024 * 1024),
  dataUrl: z.string().trim().min(1),
});

const claimPayloadSchema = z
  .object({
    PESEL_NIP_KLIENTA: z.string().trim().optional(),
    NR_DOK_TOZSAMOSCI: z.string().trim().optional(),
    NUMER_KONTA_BANKOWEGO: z.string().trim().optional(),
    KARTA_POKLADOWA: applicationFileSchema.optional(),
    ZDJECIA_DODATKOWE: z.array(applicationFileSchema).optional(),
  })
  .passthrough();

const publicClaimApplicationSchema = z
  .object({
    leadId: optionalString,
    claimPayload: claimPayloadSchema.optional(),
    flightId: optionalString,
    manual: z.boolean().default(false),
    source: z
      .enum([ClaimSource.WEBSITE_FORM, ClaimSource.CHECKER_FORM])
      .default(ClaimSource.WEBSITE_FORM),
    flightNumber: z
      .string()
      .trim()
      .regex(flightNumberPattern, "Podaj poprawny numer lotu, np. LO123."),
    flightDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Podaj datę lotu.")
      .refine(isPastFlightDate, {
        message: "Data lotu musi być z przeszłości i maksymalnie 3 lata wstecz.",
      }),
    departureAirportCode: optionalString,
    arrivalAirportCode: optionalString,
    delayMinutes: z.number().int().min(0).max(1440).nullable().optional(),
    type: z.enum(ClaimType),
    passengersCount: z.number().int().min(1).max(9),
    primaryPassenger: z.object({
      firstName: nonEmptyString("Podaj imię."),
      lastName: nonEmptyString("Podaj nazwisko."),
      pesel: optionalPesel,
      email: z.string().trim().email("Podaj poprawny adres email."),
      phone: nonEmptyString("Podaj numer telefonu.").min(5, {
        message: "Numer telefonu jest zbyt krótki.",
      }),
      address: nonEmptyString("Podaj adres."),
      postalCode: nonEmptyString("Podaj kod pocztowy."),
      city: nonEmptyString("Podaj miasto."),
      country: nonEmptyString("Podaj kraj.").default("PL"),
    }),
    additionalPassengers: z.array(passengerSchema).default([]),
    consents: z.object({
      termsAccepted: z.boolean().refine(Boolean, {
        message: "Akceptacja regulaminu i polityki prywatności jest wymagana.",
      }),
      assignmentAccepted: z.boolean().refine(Boolean, {
        message: "Zgoda na cesję wierzytelności jest wymagana.",
      }),
      marketingAccepted: z.boolean().default(false),
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.flightId) {
      if (
        !data.departureAirportCode ||
        !airportCodePattern.test(data.departureAirportCode)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["departureAirportCode"],
          message: "Podaj trzyliterowy kod lotniska wylotu.",
        });
      }

      if (
        !data.arrivalAirportCode ||
        !airportCodePattern.test(data.arrivalAirportCode)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["arrivalAirportCode"],
          message: "Podaj trzyliterowy kod lotniska przylotu.",
        });
      }
    }

    const expectedAdditionalPassengers = Math.max(0, data.passengersCount - 1);

    if (data.additionalPassengers.length !== expectedAdditionalPassengers) {
      ctx.addIssue({
        code: "custom",
        path: ["additionalPassengers"],
        message: "Liczba pasażerów dodatkowych nie zgadza się z formularzem.",
      });
    }
  });

export type PublicClaimApplicationInput = z.input<
  typeof publicClaimApplicationSchema
>;

export type SubmitApplicationResult =
  | {
      ok: true;
      claimNumber: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

type ApplicationFileInput = z.infer<typeof applicationFileSchema>;

async function saveApplicationAttachments(input: {
  claimId: string;
  uploadedById: string;
  files: ApplicationFileInput[];
}) {
  for (const [index, file] of input.files.entries()) {
    const parsedFile = parseDataUrl(file.dataUrl);
    const storageKey = getStorageKey(input.claimId, file.fileName);
    const upload = await uploadObject({
      key: storageKey,
      body: parsedFile.buffer,
      contentType: parsedFile.contentType,
      allowDevelopmentLocalFallback: true,
    });

    await prisma.attachment.create({
      data: {
        claimId: input.claimId,
        uploadedById: input.uploadedById,
        type: index === 0 ? AttachmentType.BOARDING_PASS : AttachmentType.OTHER,
        fileName: file.fileName,
        mimeType: parsedFile.contentType,
        sizeBytes: parsedFile.buffer.byteLength,
        storageKey: upload.storageKey,
        verificationStatus: "UPLOADED",
      },
    });
  }
}

export async function submitPublicClaimApplication(
  input: PublicClaimApplicationInput,
): Promise<SubmitApplicationResult> {
  if (!hasPrismaDatabaseUrl()) {
    return {
      ok: false,
      message:
        "Brakuje konfiguracji bazy danych. Spróbuj ponownie później albo skontaktuj się z OWEME.",
    };
  }

  const parsed = publicClaimApplicationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Sprawdź wymagane pola formularza.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const claimPayload = data.claimPayload;
  const applicationFiles = [
    ...(claimPayload?.KARTA_POKLADOWA ? [claimPayload.KARTA_POKLADOWA] : []),
    ...(claimPayload?.ZDJECIA_DODATKOWE ?? []),
  ];

  try {
    const { claim, systemUserId } = await prisma.$transaction(async (tx) => {
      const clientEmail = data.primaryPassenger.email.toLowerCase();
      const identityDocument = claimPayload?.NR_DOK_TOZSAMOSCI?.trim();
      const existingClient = await tx.client.findFirst({
        where: {
          email: {
            equals: clientEmail,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          marketingConsent: true,
        },
      });
      const client = existingClient
        ? await tx.client.update({
            where: {
              id: existingClient.id,
            },
            data: {
              firstName: data.primaryPassenger.firstName,
              lastName: data.primaryPassenger.lastName,
              email: clientEmail,
              phone: data.primaryPassenger.phone,
              pesel: data.primaryPassenger.pesel ?? undefined,
              documentNumber: identityDocument || undefined,
              idDocumentNumber: identityDocument || undefined,
              address: data.primaryPassenger.address,
              postalCode: data.primaryPassenger.postalCode,
              city: data.primaryPassenger.city,
              country: data.primaryPassenger.country,
              marketingConsent:
                existingClient.marketingConsent ||
                data.consents.marketingAccepted,
            },
            select: {
              id: true,
            },
          })
        : await tx.client.create({
            data: {
              firstName: data.primaryPassenger.firstName,
              lastName: data.primaryPassenger.lastName,
              email: clientEmail,
              phone: data.primaryPassenger.phone,
              pesel: data.primaryPassenger.pesel ?? null,
              documentNumber: identityDocument || null,
              idDocumentNumber: identityDocument || null,
              address: data.primaryPassenger.address,
              postalCode: data.primaryPassenger.postalCode,
              city: data.primaryPassenger.city,
              country: data.primaryPassenger.country,
              marketingConsent: data.consents.marketingAccepted,
            },
            select: {
              id: true,
            },
          });
      const systemUser = await getOrCreateSystemUser(tx);
      const flight = data.flightId
        ? await tx.flight.findUnique({
            where: {
              id: data.flightId,
            },
            select: {
              id: true,
              airlineId: true,
            },
          })
        : await createManualFlight(tx, {
            flightNumber: normalizeFlightNumber(data.flightNumber),
            flightDate: data.flightDate,
            departureAirportCode: normalizeAirportCode(
              data.departureAirportCode ?? "",
            ),
            arrivalAirportCode: normalizeAirportCode(
              data.arrivalAirportCode ?? "",
            ),
            delayMinutes: data.delayMinutes ?? null,
            estimatedAmountEur: estimatedAmountFromPayload(claimPayload),
          });

      if (!flight) {
        throw new Error("Nie znaleziono wskazanego lotu.");
      }

      const createdClaim = await createClaimWithHistoryInTransaction(tx, {
        type: data.type,
        source: data.source,
        initialStatus: ClaimStatus.AWAITING_VERIFICATION,
        clientId: client.id,
        creatorId: systemUser.id,
        flightId: flight.id,
        airlineId: flight.airlineId,
        clientIban: claimPayload?.NUMER_KONTA_BANKOWEGO ?? null,
        applicationPayload: toJsonValue(claimPayload),
        isPolishJurisdiction: true,
        passengers: [
          {
            firstName: data.primaryPassenger.firstName,
            lastName: data.primaryPassenger.lastName,
            isPrimary: true,
            clientId: client.id,
          },
          ...data.additionalPassengers.map((passenger) => ({
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            isPrimary: false,
            clientId: null,
          })),
        ],
      });

      if (data.leadId) {
        await tx.lead.updateMany({
          where: {
            id: data.leadId,
          },
          data: {
            status: LeadStatus.CONVERTED,
            convertedClaimId: createdClaim.id,
            convertedAt: new Date(),
          },
        });
      }

      return { claim: createdClaim, systemUserId: systemUser.id };
    });

    if (applicationFiles.length) {
      try {
        await saveApplicationAttachments({
          claimId: claim.id,
          uploadedById: systemUserId,
          files: applicationFiles,
        });
      } catch (error) {
        console.error(
          "[Formularz] Wniosek został utworzony, ale nie udało się zapisać załączników.",
          {
            claimId: claim.id,
            error,
          },
        );
      }
    }

    await Promise.all([
      sendInngestEvent({
        name: "claim/created",
        data: {
          claimId: claim.id,
        },
      }),
      emitEvent("claim.created", {
        claimId: claim.id,
      }).catch((error) => {
        console.error(
          "[MAIL_ERROR] Nie udało się obsłużyć eventu claim.created dla wniosku publicznego.",
          {
            claimId: claim.id,
            error,
          },
        );
      }),
    ]);

    revalidatePath("/crm/claims");
    revalidatePath("/crm/do-analizy");
    revalidatePath("/crm/leads");

    return {
      ok: true,
      claimNumber: claim.claimNumber,
    };
  } catch (error) {
    console.error("[Formularz] Nie udało się utworzyć wniosku.", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nie udało się utworzyć wniosku. Spróbuj ponownie później.",
    };
  }
}
