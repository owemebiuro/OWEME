import { UserRole } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import type { AppUser } from "@/types/auth";

const BOOTSTRAP_ADMIN_EMAILS_ENV = "OWEME_BOOTSTRAP_ADMIN_EMAILS";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getBootstrapAdminEmails() {
  return (process.env[BOOTSTRAP_ADMIN_EMAILS_ENV] ?? "")
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getAuthUserDisplayName(authUser: Pick<SupabaseUser, "email" | "user_metadata">) {
  const metadataName =
    typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : null;

  if (metadataName?.trim()) {
    return metadataName.trim();
  }

  return authUser.email?.split("@")[0] ?? "Administrator OWEME";
}

async function isBootstrapAdminAllowed(email: string) {
  const bootstrapEmails = getBootstrapAdminEmails();

  if (bootstrapEmails.includes(email)) {
    return true;
  }

  const usersCount = await prisma.user.count();
  return usersCount === 0;
}

export async function ensureBootstrapAdminUser(
  authUser: Pick<SupabaseUser, "id" | "email" | "user_metadata">,
): Promise<AppUser | null> {
  if (!hasPrismaDatabaseUrl() || !authUser.email) {
    return null;
  }

  const email = normalizeEmail(authUser.email);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: authUser.id }, { email }],
    },
    select: {
      id: true,
      authUserId: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (existingUser?.isActive && existingUser.role === UserRole.ADMIN) {
    return existingUser;
  }

  if (!(await isBootstrapAdminAllowed(email))) {
    return null;
  }

  const userData = {
    authUserId: authUser.id,
    email,
    name: existingUser?.name ?? getAuthUserDisplayName(authUser),
    role: UserRole.ADMIN,
    isActive: true,
  };

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: userData,
      select: {
        id: true,
        authUserId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  return prisma.user.create({
    data: userData,
    select: {
      id: true,
      authUserId: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });
}

export async function resolveBootstrapAdminUser(
  authUser: Pick<SupabaseUser, "id" | "email" | "user_metadata">,
  currentAppUser: AppUser | null,
) {
  if (currentAppUser?.isActive && currentAppUser.role === UserRole.ADMIN) {
    return currentAppUser;
  }

  return (await ensureBootstrapAdminUser(authUser)) ?? currentAppUser;
}
