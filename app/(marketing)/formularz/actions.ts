"use server";

import { ClaimSource, ClaimStatus, ClaimType, CommissionModel } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const additionalPassengerSchema = z.object({
  firstName: z.string().trim().min(1, "Wymagane"),
  lastName: z.string().trim().min(1, "Wymagane"),
});

const claimTypeValues = [
  ClaimType.DELAY,
  ClaimType.CANCELLATION,
  ClaimType.DENIED_BOARDING,
] as const;

const submitSchema = z.object({
  flightNumber: z.string().trim().min(2),
  flightDate: z.string().min(1),
  claimType: z.enum(claimTypeValues),
  passengerCount: z.coerce.number().int().min(1).max(9),
  flightId: z.string().optional(),
  firstName: z.string().trim().min(1, "Wymagane"),
  lastName: z.string().trim().min(1, "Wymagane"),
  email: z.string().trim().email("Nieprawidłowy adres email"),
  phone: z.string().trim().min(5, "Wymagany numer telefonu"),
  address: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().default("PL"),
  additionalPassengers: z.array(additionalPassengerSchema).optional(),
  acceptTerms: z.boolean().refine((v) => v, "Wymagana akceptacja regulaminu"),
  acceptCession: z.boolean().refine((v) => v, "Wymagana zgoda na cesję"),
  marketingConsent: z.boolean().optional(),
});

export type SubmitFormInput = z.infer<typeof submitSchema>;
export type SubmitFormResult =
  | { success: true; claimNumber: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function generateClaimNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OW-${year}-`;
  const lastClaim = await prisma.claim.findFirst({
    where: { claimNumber: { startsWith: prefix } },
    orderBy: { claimNumber: "desc" },
    select: { claimNumber: true },
  });
  const lastNumber = lastClaim?.claimNumber.split("-").at(-1);
  const nextNumber = (lastNumber ? Number.parseInt(lastNumber, 10) : 0) + 1;
  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
}

export async function submitClaim(data: unknown): Promise<SubmitFormResult> {
  const parsed = submitSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key] = issues ?? [];
    }
    return { success: false, error: "Popraw błędy w formularzu.", fieldErrors };
  }

  const input = parsed.data;

  try {
    const systemUser = await prisma.user.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!systemUser) {
      return { success: false, error: "Błąd systemu. Spróbuj ponownie później." };
    }

    let client = await prisma.client.findFirst({
      where: { email: input.email },
      select: { id: true },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          address: input.address ?? null,
          postalCode: input.postalCode ?? null,
          city: input.city ?? null,
          country: input.country,
        },
        select: { id: true },
      });
    }

    const claimNumber = await generateClaimNumber();

    const additionalPassengers = input.additionalPassengers ?? [];

    await prisma.claim.create({
      data: {
        claimNumber,
        type: input.claimType,
        source: ClaimSource.WEBSITE_FORM,
        status: ClaimStatus.NEW,
        creatorId: systemUser.id,
        clientId: client.id,
        flightId: input.flightId ?? null,
        commissionModel: CommissionModel.STANDARD_30,
        isPolishJurisdiction: true,
        passengers: {
          create: [
            {
              firstName: input.firstName,
              lastName: input.lastName,
              isPrimary: true,
              clientId: client.id,
            },
            ...additionalPassengers.map((p) => ({
              firstName: p.firstName,
              lastName: p.lastName,
              isPrimary: false,
            })),
          ],
        },
      },
    });

    return { success: true, claimNumber };
  } catch (err) {
    console.error("[submitClaim]", err);
    return { success: false, error: "Wystąpił błąd podczas zapisywania wniosku. Spróbuj ponownie." };
  }
}
