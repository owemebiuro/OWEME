import { NextRequest, NextResponse } from "next/server";

import { searchAirlines } from "@/lib/flight-checker-data";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  return NextResponse.json({ airlines: searchAirlines(query) });
}
