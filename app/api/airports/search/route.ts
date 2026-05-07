import { NextRequest, NextResponse } from "next/server";

import { searchAirports } from "@/lib/flight-checker-data";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  return NextResponse.json({
    airports: searchAirports(query).map((airport) => ({
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      flag: airport.flag,
    })),
  });
}
