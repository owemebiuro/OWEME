import { type NextRequest, NextResponse } from "next/server";

import { requireAnalyticsApiAccess } from "@/lib/analytics/access";
import { readRange } from "@/lib/analytics/query";
import { getMonthlyCases } from "@/lib/analytics/server";

export async function GET(request: NextRequest) {
  const access = await requireAnalyticsApiAccess();

  if (!access.ok) {
    return access.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") ?? "6m";
  const { from, to } = readRange(searchParams);
  const data = await getMonthlyCases(period, from, to);

  return NextResponse.json(data);
}
