import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";
import type { AppUser } from "@/types/auth";

type AnalyticsApiAccess =
  | {
      ok: true;
      user: AppUser;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export function canViewAnalytics(user: AppUser | null | undefined) {
  return Boolean(
    user?.isActive &&
      hasRolePermission(user.role, PERMISSIONS.REPORT_OPERATIONAL),
  );
}

export async function requireAnalyticsApiAccess(): Promise<AnalyticsApiAccess> {
  const currentUser = await getCurrentUser();

  if (!currentUser?.appUser) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Musisz się zalogować." },
        { status: 401 },
      ),
    };
  }

  if (!canViewAnalytics(currentUser.appUser)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Brak uprawnień do analityki." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    user: currentUser.appUser,
  };
}
