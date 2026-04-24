import { ClaimStatus, ClaimType } from "@prisma/client";
import { z } from "zod";

import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const TERMINAL_STATUSES = new Set<ClaimStatus>([
  ClaimStatus.WON,
  ClaimStatus.SETTLEMENT,
  ClaimStatus.CLOSED_PAID,
  ClaimStatus.REJECTED,
  ClaimStatus.DISMISSED,
]);

const WON_STATUSES = new Set<ClaimStatus>([
  ClaimStatus.WON,
  ClaimStatus.SETTLEMENT,
  ClaimStatus.CLOSED_PAID,
]);

const LOST_STATUSES = new Set<ClaimStatus>([
  ClaimStatus.REJECTED,
  ClaimStatus.DISMISSED,
]);

const monthsInputSchema = z.object({
  months: z.number().int().min(3).max(24).default(12),
});

function getMonthBuckets(months: number) {
  const buckets: { year: number; month: number; label: string; from: Date; to: Date }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = d.toLocaleDateString("pl-PL", { month: "short", year: "2-digit" });
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), label, from, to });
  }

  return buckets;
}

export const analyticsRouter = router({
  claimsOverTime: permissionProcedure(PERMISSIONS.REPORT_OPERATIONAL)
    .input(monthsInputSchema)
    .query(async ({ ctx, input }) => {
      const buckets = getMonthBuckets(input.months);
      const from = buckets[0].from;
      const to = buckets[buckets.length - 1].to;

      const claims = await ctx.prisma.claim.findMany({
        where: {
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
        select: {
          createdAt: true,
          status: true,
          type: true,
        },
      });

      return buckets.map((bucket) => {
        const inBucket = claims.filter(
          (c) => c.createdAt >= bucket.from && c.createdAt <= bucket.to,
        );
        const won = inBucket.filter((c) => WON_STATUSES.has(c.status)).length;
        const total = inBucket.length;

        return {
          label: bucket.label,
          total,
          won,
          lost: inBucket.filter((c) => LOST_STATUSES.has(c.status)).length,
          active: inBucket.filter((c) => !TERMINAL_STATUSES.has(c.status)).length,
        };
      });
    }),

  statusDistribution: permissionProcedure(PERMISSIONS.REPORT_OPERATIONAL)
    .query(async ({ ctx }) => {
      const result = await ctx.prisma.claim.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });

      return result.map((row) => ({
        status: row.status,
        count: (row._count as { id: number }).id,
      }));
    }),

  claimsByType: permissionProcedure(PERMISSIONS.REPORT_OPERATIONAL)
    .input(monthsInputSchema)
    .query(async ({ ctx, input }) => {
      const buckets = getMonthBuckets(input.months);
      const from = buckets[0].from;
      const to = buckets[buckets.length - 1].to;

      const claims = await ctx.prisma.claim.findMany({
        where: {
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
        select: { type: true, createdAt: true },
      });

      return buckets.map((bucket) => {
        const inBucket = claims.filter(
          (c) => c.createdAt >= bucket.from && c.createdAt <= bucket.to,
        );
        const byType: Record<string, number> = {};
        for (const t of Object.values(ClaimType)) {
          byType[t] = inBucket.filter((c) => c.type === t).length;
        }
        return { label: bucket.label, ...byType };
      });
    }),

  topAirlines: permissionProcedure(PERMISSIONS.REPORT_OPERATIONAL)
    .query(async ({ ctx }) => {
      const result = await ctx.prisma.claim.groupBy({
        by: ["airlineId"],
        where: { deletedAt: null, airlineId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      });

      const airlineIds = result
        .map((r) => r.airlineId)
        .filter((id): id is string => Boolean(id));

      const airlines = await ctx.prisma.airline.findMany({
        where: { id: { in: airlineIds } },
        select: { id: true, name: true, iataCode: true },
      });

      const nameById = new Map(airlines.map((a) => [a.id, a.name]));
      const iataById = new Map(airlines.map((a) => [a.id, a.iataCode]));

      return result
        .filter((r) => r.airlineId)
        .map((r) => ({
          airline: nameById.get(r.airlineId!) ?? r.airlineId!,
          iata: iataById.get(r.airlineId!) ?? "",
          count: (r._count as { id: number }).id,
        }));
    }),
});
