import { TRPCError } from "@trpc/server";

import type { Context } from "@/lib/trpc/context";
import { middleware, protectedProcedure } from "@/lib/trpc/trpc";
import {
  hasRolePermission,
  type Permission,
} from "@/lib/trpc/permissions.shared";

export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  canLawyerSetClaimStatus,
  hasRolePermission,
} from "@/lib/trpc/permissions.shared";

export function assertPermission(ctx: Context, permission: Permission) {
  if (!ctx.authUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Musisz się zalogować.",
    });
  }

  if (!ctx.appUser?.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  if (!hasRolePermission(ctx.appUser.role, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak uprawnień do tej operacji.",
    });
  }

  return ctx.appUser;
}

export function permissionMiddleware(permission: Permission) {
  return middleware(({ ctx, next }) => {
    const appUser = assertPermission(ctx, permission);

    return next({
      ctx: {
        ...ctx,
        appUser,
      },
    });
  });
}

export function permissionProcedure(permission: Permission) {
  return protectedProcedure.use(permissionMiddleware(permission));
}
