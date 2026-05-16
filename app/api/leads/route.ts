import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";

const airportSchema = z.object({
  iata: z.string().trim().length(3),
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  country: z.string().trim().optional(),
  flag: z.string().trim().min(1),
});

const airlineSchema = z.object({
  iata: z.string().trim().min(2),
  name: z.string().trim().min(1),
});

const passengerSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5),
  termsAgreed: z.literal(true),
  newsletter: z.boolean().optional(),
});

const leadSchema = z.object({
  flightData: z.object({
    departureAirport: airportSchema.nullable(),
    destinationAirport: airportSchema.nullable(),
    isDirect: z.boolean().nullable(),
    flightDate: z.string().nullable(),
    airline: airlineSchema.nullable(),
    flightNumber: z.string().nullable(),
    disruption: z.enum(["delay", "cancel", "denied"]).nullable(),
    delayHours: z.enum(["3plus", "less3", "never"]).nullable(),
    passenger: passengerSchema.nullable(),
  }),
  passenger: passengerSchema,
  result: z.object({
    eligible: z.boolean(),
    amount: z.number().int().optional(),
    currency: z.literal("EUR").optional(),
    reason: z.string().optional(),
  }),
});

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePolishPhone(value: string) {
  const digits = onlyDigits(value);
  const nationalDigits = digits.startsWith("48") ? digits.slice(2) : digits;

  if (nationalDigits.length !== 9) {
    return null;
  }

  return `+48${nationalDigits}`;
}

function formatPolishPhone(value: string) {
  const phone = normalizePolishPhone(value);

  if (!phone) {
    return value.trim();
  }

  const digits = phone.slice(3);

  return `+ 48 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function normalizeFlightNumber(
  airlineIata: string | undefined,
  flightNumber: string | null,
) {
  const normalized = flightNumber?.trim().replace(/\s+/g, "").toUpperCase();

  if (!normalized) {
    return null;
  }

  const airline = airlineIata?.trim().toUpperCase();

  return airline && /^\d/.test(normalized) ? `${airline}${normalized}` : normalized;
}

function dateFromValue(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: NextRequest) {
  if (!hasPrismaDatabaseUrl()) {
    return NextResponse.json(
      { error: "Brak konfiguracji bazy danych." },
      { status: 503 },
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane leada.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { flightData, passenger, result } = parsed.data;
    const phone = normalizePolishPhone(passenger.phone);

    if (!phone) {
      return NextResponse.json(
        { error: "Podaj telefon w formacie + 48 123 123 123." },
        { status: 400 },
      );
    }

    if (!flightData.departureAirport || !flightData.destinationAirport) {
      return NextResponse.json(
        { error: "Brakuje danych trasy lotu." },
        { status: 400 },
      );
    }

    const lead = await prisma.lead.create({
      data: {
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email.toLowerCase(),
        phone,
        phoneFormatted: formatPolishPhone(phone),
        departureAirportCode: flightData.departureAirport.iata.toUpperCase(),
        arrivalAirportCode: flightData.destinationAirport.iata.toUpperCase(),
        flightDate: dateFromValue(flightData.flightDate),
        airlineIata: flightData.airline?.iata.toUpperCase() ?? null,
        airlineName: flightData.airline?.name ?? null,
        flightNumber: normalizeFlightNumber(
          flightData.airline?.iata,
          flightData.flightNumber,
        ),
        disruption: flightData.disruption,
        delayHours: flightData.delayHours,
        estimatedAmount: result.amount ?? null,
        currency: result.currency ?? "EUR",
        eligible: result.eligible,
        marketingConsent: passenger.newsletter ?? false,
        termsAgreed: passenger.termsAgreed,
        metadata: {
          isDirect: flightData.isDirect,
          verificationReason: result.reason ?? null,
          departureAirport: flightData.departureAirport,
          destinationAirport: flightData.destinationAirport,
        },
      },
      select: {
        id: true,
      },
    });

    revalidatePath("/crm/leads");

    return NextResponse.json({ leadId: lead.id, status: "saved" });
  } catch (error) {
    console.error("[Leads] Nie udało się zapisać leada.", error);

    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
