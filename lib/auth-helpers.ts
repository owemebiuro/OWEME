import { type User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { resolveBootstrapAdminUser } from "@/lib/auth-bootstrap";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";
import { createClient } from "@/lib/supabase/server";
import type { AppUser, PermissionAction } from "@/types/auth";
import { type UserRole } from "@/types/auth";

type CurrentUser = {
  authUser: SupabaseUser;
  appUser: AppUser | null;
};

const legacyPermissionMap = {
  "crm:read": PERMISSIONS.CLAIM_READ_ALL,
  "crm:write": PERMISSIONS.CLAIM_EDIT,
  "admin:read": PERMISSIONS.ADMIN_USERS,
  "admin:write": PERMISSIONS.ADMIN_USERS,
  "claims:assign": PERMISSIONS.CLAIM_ASSIGN_OWNER,
  "documents:generate": PERMISSIONS.DOCUMENT_GENERATE,
} as const satisfies Record<PermissionAction, (typeof PERMISSIONS)[keyof typeof PERMISSIONS]>;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  let appUser = hasPrismaDatabaseUrl()
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

  appUser = await resolveBootstrapAdminUser(authUser, appUser);

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

  return hasRolePermission(user.role, legacyPermissionMap[action]);
}
