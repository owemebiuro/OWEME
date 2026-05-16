import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { IMPERSONATE_COOKIE, getCurrentUser } from "@/lib/auth-helpers";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";

const inputSchema = z.object({ userId: z.string().min(1) });

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  const realRole = currentUser?.realAppUser?.role ?? currentUser?.appUser?.role;

  if (!currentUser || realRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!hasPrismaDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, isActive: true },
  });

  if (!targetUser || !targetUser.isActive) {
    return NextResponse.json({ error: "User not found or inactive" }, { status: 404 });
  }

  const realUserId =
    currentUser.realAppUser?.id ?? currentUser.appUser?.id;

  if (parsed.data.userId === realUserId) {
    return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, parsed.data.userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
