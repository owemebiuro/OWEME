import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const airportSchema = z.object({
  iata: z.string().length(3),
  name: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1).optional(),
  flag: z.string().min(1),
});

const airlineSchema = z.object({
  iata: z.string().min(2),
  name: z.string().min(1),
});

const passengerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  termsAgreed: z.literal(true),
  newsletter: z.boolean().optional(),
});

const submitSchema = z.object({
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
  boardingPass: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parsed.error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({
      claimId: `owe_${randomUUID().slice(0, 8)}`,
      status: "pending",
    });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
