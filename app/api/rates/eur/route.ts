import { NextResponse } from "next/server";

type NbpRateResponse = {
  rates: Array<{
    effectiveDate: string;
    mid: number;
  }>;
};

let cachedRate:
  | {
      rate: number;
      effectiveDate: string;
      fetchedAt: number;
    }
  | null = null;

const cacheTtlMs = 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (cachedRate && now - cachedRate.fetchedAt < cacheTtlMs) {
    return NextResponse.json({ ...cachedRate, cached: true });
  }

  try {
    const response = await fetch(
      "https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json",
      {
        next: {
          revalidate: 3600,
        },
      },
    );

    if (!response.ok) {
      throw new Error("NBP API error");
    }

    const data = (await response.json()) as NbpRateResponse;
    const latest = data.rates[0];

    if (!latest) {
      throw new Error("NBP API returned no rates");
    }

    cachedRate = {
      rate: latest.mid,
      effectiveDate: latest.effectiveDate,
      fetchedAt: now,
    };

    return NextResponse.json({ ...cachedRate, cached: false });
  } catch {
    if (cachedRate) {
      return NextResponse.json({
        ...cachedRate,
        cached: true,
        fallback: true,
      });
    }

    return NextResponse.json(
      { error: "Nie udało się pobrać kursu EUR/PLN." },
      { status: 503 },
    );
  }
}
