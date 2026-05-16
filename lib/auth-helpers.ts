import { type User as SupabaseUser } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { resolveBootstrapAdminUser } from "@/lib/auth-bootstrap";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";
import { createClient } from "@/lib/supabase/server";
import type { AppUser, PermissionAction } from "@/types/auth";
import { type UserRole } from "@/types/auth";

export const IMPERSONATE_COOKIE = "oweme_impersonate_id";

export type CurrentUser = {
  authUser: SupabaseUser;
  appUser: AppUser | null;
  realAppUser: AppUser | null;
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

  const userSelect = {
    id: true,
    authUserId: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
  } as const;

  let appUser = hasPrismaDatabaseUrl()
    ? await prisma.user.findFirst({
        where: {
          isActive: true,
          OR: [
            { authUserId: authUser.id },
            ...(authUser.email ? [{ email: authUser.email.toLowerCase() }] : []),
          ],
        },
        select: userSelect,
      })
    : null;

  appUser = await resolveBootstrapAdminUser(authUser, appUser);

  let realAppUser: AppUser | null = null;

  if (appUser?.role === "SUPER_ADMIN" && hasPrismaDatabaseUrl()) {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value;

    if (impersonateId) {
      const impersonatedUser = await prisma.user.findUnique({
        where: { id: impersonateId },
        select: userSelect,
      });

      if (impersonatedUser) {
        realAppUser = appUser;
        appUser = impersonatedUser;
      }
    }
  }

  return {
    authUser,
    appUser,
    realAppUser,
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

  const effectiveRole =
    currentUser.realAppUser?.role ?? currentUser.appUser?.role;

  if (
    !currentUser.appUser ||
    (!roles.includes(currentUser.appUser.role) &&
      effectiveRole !== "SUPER_ADMIN")
  ) {
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
