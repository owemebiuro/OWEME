import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { CLAIM_AMOUNTS } from "@/lib/constants";
import { compensationAmount } from "@/lib/flight-checker-data";
import { claimSchema } from "@/lib/schemas";
import type { VerifyResponse as LegacyVerifyResponse } from "@/types/claim";

const wizardVerifySchema = z.object({
  from: z.string().trim().length(3).toUpperCase(),
  to: z.string().trim().length(3).toUpperCase(),
  date: z.string().trim().min(1),
  airline: z.string().trim().min(2).toUpperCase(),
  flightNumber: z.string().trim().regex(/^\d{1,4}$/),
  disruption: z.enum(["delay", "cancel", "denied"]),
  delayHours: z.enum(["3plus", "less3", "never"]).optional(),
});

type WizardVerifyRequest = z.infer<typeof wizardVerifySchema>;

type WizardVerifyResponse = {
  eligible: boolean;
  amount?: number;
  currency?: "EUR";
  reason?: string;
  regulation: "EC261";
};

function isWizardRequest(body: unknown): body is WizardVerifyRequest {
  return wizardVerifySchema.safeParse(body).success;
}

function verifyWizardClaim(input: WizardVerifyRequest): WizardVerifyResponse {
  const eligible =
    input.disruption === "cancel" ||
    input.disruption === "denied" ||
    (input.disruption === "delay" &&
      (input.delayHours === "3plus" || input.delayHours === "never"));

  if (!eligible) {
    return {
      eligible: false,
      reason:
        "EC 261/2004 zwykle wymaga co najmniej 3 godzin opóźnienia przy przylocie.",
      regulation: "EC261",
    };
  }

  return {
    eligible: true,
    amount: compensationAmount(input.from, input.to),
    currency: "EUR",
    regulation: "EC261",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const wizardParsed = wizardVerifySchema.safeParse(body);

    if (wizardParsed.success) {
      return NextResponse.json(verifyWizardClaim(wizardParsed.data));
    }

    if (isWizardRequest(body)) {
      return NextResponse.json(verifyWizardClaim(body));
    }

    const legacyParsed = claimSchema.safeParse(body);

    if (!legacyParsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: legacyParsed.error.issues },
        { status: 400 },
      );
    }

    const { flightNumber, flightDate, disruption } = legacyParsed.data;
    const amount = CLAIM_AMOUNTS[disruption].numeric;
    const response: LegacyVerifyResponse = {
      eligible: true,
      amount,
      currency: "EUR",
      flightInfo: {
        number: flightNumber.replace(/\s+/g, "").toUpperCase(),
        date: flightDate,
        route: "WAW — LHR",
      },
      regulation: "EC261",
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
