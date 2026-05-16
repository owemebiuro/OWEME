import { type NextRequest, NextResponse } from "next/server";

import { requireAnalyticsApiAccess } from "@/lib/analytics/access";
import { readLimit, readPeriod, readRange } from "@/lib/analytics/query";
import { getEmployeeStats } from "@/lib/analytics/server";

export async function GET(request: NextRequest) {
  const access = await requireAnalyticsApiAccess();

  if (!access.ok) {
    return access.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const period = readPeriod(searchParams);
  const limit = readLimit(searchParams, 5);
  const { from, to } = readRange(searchParams);
  const data = await getEmployeeStats(period, limit, from, to);

  return NextResponse.json(data);
}
