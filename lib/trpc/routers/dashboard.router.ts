import { router, publicProcedure } from "@/lib/trpc/trpc";

export const dashboardRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { ok: true } as const;
  }),
});
