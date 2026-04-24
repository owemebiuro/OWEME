import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";

import { toSchemaOutdatedTRPCError } from "@/lib/prisma-errors";
import type { Context } from "@/lib/trpc/context";

const t = initTRPC.context<Context>().create();

const timingMiddleware = t.middleware(async ({ next, path, type }) => {
  const start = Date.now();

  try {
    const result = await next();

    if (process.env.NODE_ENV === "development") {
      const duration = Date.now() - start;
      console.log(`[tRPC] ${type} ${path} ${duration}ms`);
    }

    return result;
  } catch (error) {
    const schemaError = toSchemaOutdatedTRPCError(error);

    if (schemaError) {
      throw schemaError;
    }

    throw error;
  }
});

const requireAuthMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.authUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Musisz się zalogować.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      authUser: ctx.authUser,
    },
  });
});

const requireAdminMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.appUser || ctx.appUser.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Wymagana jest rola ADMIN.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      appUser: ctx.appUser,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = publicProcedure.use(requireAuthMiddleware);
export const adminProcedure = protectedProcedure.use(requireAdminMiddleware);
