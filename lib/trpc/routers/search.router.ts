import { z } from "zod";

import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const globalSearchInputSchema = z.object({
  query: z.string().trim().min(3, "Wpisz co najmniej 3 znaki."),
});

export const searchRouter = router({
  globalSearch: permissionProcedure(PERMISSIONS.CLAIM_READ_ALL)
    .input(globalSearchInputSchema)
    .query(async ({ ctx, input }) => {
      const contains = {
        contains: input.query,
        mode: "insensitive" as const,
      };

      const [claims, clients] = await ctx.prisma.$transaction([
        ctx.prisma.claim.findMany({
          where: {
            deletedAt: null,
            OR: [
              { claimNumber: contains },
              { client: { is: { firstName: contains } } },
              { client: { is: { lastName: contains } } },
              { client: { is: { email: contains } } },
            ],
          },
          select: {
            id: true,
            claimNumber: true,
            status: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        }),
        ctx.prisma.client.findMany({
          where: {
            OR: [
              { firstName: contains },
              { lastName: contains },
              { email: contains },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          take: 5,
        }),
      ]);

      return {
        claims: claims.map((claim) => ({
          id: claim.id,
          claimNumber: claim.claimNumber,
          clientName: `${claim.client.firstName} ${claim.client.lastName}`,
          status: claim.status,
        })),
        clients,
      };
    }),
});
