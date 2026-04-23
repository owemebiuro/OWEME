"use server";

import { ClaimSource, ClaimType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createClaimWithHistoryInTransaction,
  createManualFlight,
  getOrCreateSystemUser,
} from "@/lib/claims/create-claim";
import { sendClaimRegisteredEmail } from "@/lib/email/claim-emails";
import { sendInngestEvent } from "@/lib/inngest/events";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";

const flightNumberPattern = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i;
const airportCodePattern = /^[A-Z]{3}$/i;

const nonEmptyString = (message: string) =>
  z.string().trim().min(1, { message });

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional();

function normalizeFlightNumber(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeAirportCode(value: string) {
  return value.trim().toUpperCase();
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

const publicClaimApplicationSchema = z
  .object({
    flightId: optionalString,
    manual: z.boolean().default(false),
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

  try {
    const claim = await prisma.$transaction(async (tx) => {
      const clientEmail = data.primaryPassenger.email.toLowerCase();
      const existingClient = await tx.client.findFirst({
        where: {
          email: {
            equals: clientEmail,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
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
              address: data.primaryPassenger.address,
              postalCode: data.primaryPassenger.postalCode,
              city: data.primaryPassenger.city,
              country: data.primaryPassenger.country,
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
              address: data.primaryPassenger.address,
              postalCode: data.primaryPassenger.postalCode,
              city: data.primaryPassenger.city,
              country: data.primaryPassenger.country,
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
          });

      if (!flight) {
        throw new Error("Nie znaleziono wskazanego lotu.");
      }

      return createClaimWithHistoryInTransaction(tx, {
        type: data.type,
        source: ClaimSource.WEBSITE_FORM,
        clientId: client.id,
        creatorId: systemUser.id,
        flightId: flight.id,
        airlineId: flight.airlineId,
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
    });

    await Promise.all([
      sendInngestEvent({
        name: "claim/created",
        data: {
          claimId: claim.id,
        },
      }),
      sendClaimRegisteredEmail(claim.id).catch((error) => {
        console.error(
          "[Email] Nie udało się wysłać potwierdzenia wniosku publicznego.",
          {
            claimId: claim.id,
            error,
          },
        );
      }),
    ]);

    revalidatePath("/crm/claims");

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
