import type { User as SupabaseUser } from "@supabase/supabase-js";

import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import type { AppUser } from "@/types/auth";

export type Context = {
  req?: Request;
  prisma: typeof prisma;
  authUser: SupabaseUser | null;
  appUser: AppUser | null;
  realAppUser: AppUser | null;
};

type CreateContextOptions = {
  req?: Request;
};

export async function createTRPCContext(
  options: CreateContextOptions = {},
): Promise<Context> {
  const currentUser = await getCurrentUser();

  return {
    req: options.req,
    prisma,
    authUser: currentUser?.authUser ?? null,
    appUser: currentUser?.appUser ?? null,
    realAppUser: currentUser?.realAppUser ?? null,
  };
}
