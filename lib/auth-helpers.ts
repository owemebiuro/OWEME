import { type User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { AppUser, PermissionAction } from "@/types/auth";
import { type UserRole } from "@/types/auth";

type CurrentUser = {
  authUser: SupabaseUser;
  appUser: AppUser | null;
};

const rolePermissions: Record<UserRole, readonly PermissionAction[]> = {
  ADMIN: [
    "crm:read",
    "crm:write",
    "admin:read",
    "admin:write",
    "claims:assign",
    "documents:generate",
  ],
  OPERATOR: ["crm:read", "crm:write", "claims:assign", "documents:generate"],
  LAWYER: ["crm:read", "crm:write", "documents:generate"],
  MARKETING: ["crm:read"],
  READ_ONLY: ["crm:read"],
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const appUser = hasPrismaDatabaseUrl()
    ? await prisma.user.findFirst({
        where: {
          isActive: true,
          OR: [
            { authUserId: authUser.id },
            ...(authUser.email ? [{ email: authUser.email.toLowerCase() }] : []),
          ],
        },
        select: {
          id: true,
          authUserId: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      })
    : null;

  return {
    authUser,
    appUser,
  };
}

export async function requireAuth() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return currentUser;
}

export async function requireRole(roles: readonly UserRole[]) {
  const currentUser = await requireAuth();

  if (!currentUser.appUser || !roles.includes(currentUser.appUser.role)) {
    redirect("/crm");
  }

  return {
    ...currentUser,
    appUser: currentUser.appUser,
  };
}

export function hasPermission(
  user: AppUser | null | undefined,
  action: PermissionAction,
) {
  if (!user?.isActive) {
    return false;
  }

  return rolePermissions[user.role].includes(action);
}
