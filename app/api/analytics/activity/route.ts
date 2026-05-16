import { type NextRequest, NextResponse } from "next/server";

import { requireAnalyticsApiAccess } from "@/lib/analytics/access";
import { readWeeks } from "@/lib/analytics/query";
import { getActivityHeatmap } from "@/lib/analytics/server";

export async function GET(request: NextRequest) {
  const access = await requireAnalyticsApiAccess();

  if (!access.ok) {
    return access.response;
  }

  const weeks = readWeeks(request.nextUrl.searchParams, 12);
  const data = await getActivityHeatmap(weeks);

  return NextResponse.json(data);
}
