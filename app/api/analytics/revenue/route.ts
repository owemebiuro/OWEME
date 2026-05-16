import { type NextRequest, NextResponse } from "next/server";

import { requireAnalyticsApiAccess } from "@/lib/analytics/access";
import { readGroupBy, readPeriod, readRange } from "@/lib/analytics/query";
import { getAnalyticsRevenue } from "@/lib/analytics/server";

export async function GET(request: NextRequest) {
  const access = await requireAnalyticsApiAccess();

  if (!access.ok) {
    return access.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const period = readPeriod(searchParams);
  const groupBy = readGroupBy(searchParams);
  const { from, to } = readRange(searchParams);
  const data = await getAnalyticsRevenue(period, groupBy, from, to);

  return NextResponse.json(data);
}
