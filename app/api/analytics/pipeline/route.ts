import { NextResponse } from "next/server";

import { requireAnalyticsApiAccess } from "@/lib/analytics/access";
import { getPipelineValue } from "@/lib/analytics/server";

export async function GET() {
  const access = await requireAnalyticsApiAccess();

  if (!access.ok) {
    return access.response;
  }

  const data = await getPipelineValue();

  return NextResponse.json(data);
}
