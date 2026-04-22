import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "@/lib/trpc/trpc";

export const usersRouter = router({
  listActive: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.appUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
      });
    }

    return ctx.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),
});
