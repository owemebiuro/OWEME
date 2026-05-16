import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { IMPERSONATE_COOKIE } from "@/lib/auth-helpers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
  return NextResponse.json({ ok: true });
}
