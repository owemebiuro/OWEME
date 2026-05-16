import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      userId: currentUser.appUser.id,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return NextResponse.json({ ok: true });
}
