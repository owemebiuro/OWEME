import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth-helpers";
import { emitEvent } from "@/src/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testEmailSchema = z.object({
  to: z.string().trim().email().toLowerCase().optional(),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  const appUser = currentUser?.appUser;

  if (!appUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (appUser.role !== UserRole.ADMIN && appUser.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = testEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await emitEvent("system.email.test", {
    to: parsed.data.to ?? appUser.email,
    requestedById: appUser.id,
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
  });
}
