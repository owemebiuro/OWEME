import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: currentUser.appUser.id,
    },
    select: {
      id: true,
      claimId: true,
      taskId: true,
    },
  });

  if (!notification) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await prisma.notification.update({
    where: {
      id,
    },
    data: {
      read: true,
    },
  });

  return NextResponse.json({
    ok: true,
    href: notification.claimId
      ? `/crm/claims/${notification.claimId}`
      : "/crm/tasks",
  });
}
