import { z } from "zod";

import { fetchFlightData } from "@/lib/services/flight-data.service";

const bodySchema = z.object({
  flightNumber: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i, {
      message: "Numer lotu ma nieprawidłowy format.",
    })
    .transform((value) => value.replace(/\s+/g, "").toUpperCase()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          found: false,
          flight: null,
          compensation: {
            amountEur: null,
            category: null,
            reason: "Podaj poprawny numer lotu i datę.",
          },
          error: "Podaj poprawny numer lotu i datę.",
          warnings: [],
          cacheHit: false,
          persistedFlightId: null,
        },
        { status: 400 },
      );
    }

    const result = await fetchFlightData(
      parsed.data.flightNumber,
      parsed.data.date,
    );

    return Response.json(result);
  } catch {
    return Response.json(
      {
        found: false,
        flight: null,
        compensation: {
          amountEur: null,
          category: null,
          reason:
            "Nie udało się pobrać danych lotu. Spróbuj ponownie albo wybierz ręczne uzupełnienie danych.",
        },
        error:
          "Nie udało się pobrać danych lotu. Spróbuj ponownie albo wybierz ręczne uzupełnienie danych.",
        warnings: [],
        cacheHit: false,
        persistedFlightId: null,
      },
      { status: 500 },
    );
  }
}
