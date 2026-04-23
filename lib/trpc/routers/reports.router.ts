import { ClaimSource, ClaimStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const qualifiedStatuses: readonly ClaimStatus[] = [
  ClaimStatus.QUALIFIED,
  ClaimStatus.DOCUMENTS_GENERATED,
  ClaimStatus.ASSIGNMENT_SIGNED,
  ClaimStatus.DEMAND_LETTER_PREPARED,
  ClaimStatus.DEMAND_LETTER_SENT,
  ClaimStatus.AWAITING_AIRLINE_RESPONSE,
  ClaimStatus.NEGATIVE_RESPONSE,
  ClaimStatus.COURT_DECISION_PENDING,
  ClaimStatus.COURT_STAGE,
  ClaimStatus.WON,
  ClaimStatus.SETTLEMENT,
  ClaimStatus.CLOSED_PAID,
] as const;

const dateRangeInputSchema = z
  .object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
  })
  .refine((input) => input.dateFrom <= input.dateTo, {
    message: "Data początkowa nie może być późniejsza niż końcowa.",
    path: ["dateFrom"],
  });

type DateRangeInput = z.infer<typeof dateRangeInputSchema>;

type ClaimTimeline = {
  createdAt: Date;
  statusHistory: {
    newStatus: ClaimStatus;
    createdAt: Date;
  }[];
};

function toDayStart(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toDayEnd(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function normalizeDateRange(input: DateRangeInput) {
  return {
    dateFrom: toDayStart(input.dateFrom),
    dateTo: toDayEnd(input.dateTo),
  };
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function groupCount(count: unknown) {
  if (!count || typeof count !== "object") {
    return 0;
  }

  const idCount = (count as { id?: unknown }).id;

  return typeof idCount === "number" ? idCount : 0;
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function daysBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

function firstStatusDate(claim: ClaimTimeline, status: ClaimStatus) {
  return claim.statusHistory.find((history) => history.newStatus === status)
    ?.createdAt;
}

function averageDaysBetweenStatuses(
  claims: ClaimTimeline[],
  startStatus: ClaimStatus | "CREATED",
  endStatus: ClaimStatus,
) {
  const durations = claims.flatMap((claim) => {
    const start =
      startStatus === "CREATED"
        ? claim.createdAt
        : firstStatusDate(claim, startStatus);
    const end = firstStatusDate(claim, endStatus);

    if (!start || !end || end < start) {
      return [];
    }

    return [daysBetween(start, end)];
  });

  return Number(average(durations).toFixed(1));
}

function isQualifiedClaim(claim: {
  status: ClaimStatus;
  qualifiedAt: Date | null;
}) {
  return Boolean(
    claim.qualifiedAt || qualifiedStatuses.includes(claim.status),
  );
}

function buildClaimPeriodWhere(
  dateFrom: Date,
  dateTo: Date,
): Prisma.ClaimWhereInput {
  return {
    deletedAt: null,
    createdAt: {
      gte: dateFrom,
      lte: dateTo,
    },
  };
}

export const reportsRouter = router({
  operationalKpis: permissionProcedure(PERMISSIONS.REPORT_OPERATIONAL)
    .input(dateRangeInputSchema)
    .query(async ({ ctx, input }) => {
      const { dateFrom, dateTo } = normalizeDateRange(input);
      const claimsWhere = buildClaimPeriodWhere(dateFrom, dateTo);
      const today = toDayStart(new Date());

      const [
        totalClaims,
        byStatusRaw,
        claimTimelines,
        claimsPerOwner,
        wonPerOwner,
        overdueTasksCount,
      ] = await ctx.prisma.$transaction([
        ctx.prisma.claim.count({
          where: claimsWhere,
        }),
        ctx.prisma.claim.groupBy({
          by: ["status"],
          where: claimsWhere,
          orderBy: {
            status: "asc",
          },
          _count: {
            id: true,
          },
        }),
        ctx.prisma.claim.findMany({
          where: claimsWhere,
          select: {
            createdAt: true,
            statusHistory: {
              orderBy: {
                createdAt: "asc",
              },
              select: {
                newStatus: true,
                createdAt: true,
              },
            },
          },
        }),
        ctx.prisma.claim.groupBy({
          by: ["ownerId"],
          where: {
            ...claimsWhere,
            ownerId: {
              not: null,
            },
          },
          orderBy: {
            ownerId: "asc",
          },
          _count: {
            id: true,
          },
        }),
        ctx.prisma.claim.groupBy({
          by: ["ownerId"],
          where: {
            ...claimsWhere,
            ownerId: {
              not: null,
            },
            status: ClaimStatus.WON,
          },
          orderBy: {
            ownerId: "asc",
          },
          _count: {
            id: true,
          },
        }),
        ctx.prisma.task.count({
          where: {
            status: "OPEN",
            dueDate: {
              lt: today,
            },
            claim: {
              deletedAt: null,
            },
          },
        }),
      ]);

      const ownerIds = claimsPerOwner
        .map((item) => item.ownerId)
        .filter((id): id is string => Boolean(id));
      const owners = ownerIds.length
        ? await ctx.prisma.user.findMany({
            where: {
              id: {
                in: ownerIds,
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [];
      const ownerNameById = new Map(
        owners.map((owner) => [owner.id, owner.name]),
      );
      const wonCountByOwnerId = new Map(
        wonPerOwner
          .filter((item) => Boolean(item.ownerId))
          .map((item) => [item.ownerId as string, groupCount(item._count)]),
      );

      return {
        totalClaims,
        byStatus: byStatusRaw.map((item) => ({
          status: item.status,
          count: groupCount(item._count),
        })),
        avgTimeToQualification: averageDaysBetweenStatuses(
          claimTimelines,
          "CREATED",
          ClaimStatus.QUALIFIED,
        ),
        avgTimeToDemandLetter: averageDaysBetweenStatuses(
          claimTimelines,
          ClaimStatus.QUALIFIED,
          ClaimStatus.DEMAND_LETTER_SENT,
        ),
        avgTimeToClose: averageDaysBetweenStatuses(
          claimTimelines,
          "CREATED",
          ClaimStatus.CLOSED_PAID,
        ),
        claimsPerOperator: claimsPerOwner
          .filter((item) => Boolean(item.ownerId))
          .map((item) => ({
            userId: item.ownerId as string,
            userName: ownerNameById.get(item.ownerId as string) ?? "Nieznany",
            count: groupCount(item._count),
            wonCount: wonCountByOwnerId.get(item.ownerId as string) ?? 0,
          }))
          .sort((a, b) => b.count - a.count),
        overdueTasksCount,
      };
    }),

  financialKpis: permissionProcedure(PERMISSIONS.REPORT_FINANCIAL)
    .input(dateRangeInputSchema)
    .query(async ({ ctx, input }) => {
      const { dateFrom, dateTo } = normalizeDateRange(input);
      const claimsWhere = buildClaimPeriodWhere(dateFrom, dateTo);

      const [
        potentialValue,
        courtStageValue,
        payouts,
        wonCount,
        rejectedCount,
        dismissedCount,
      ] = await ctx.prisma.$transaction([
        ctx.prisma.claim.aggregate({
          where: claimsWhere,
          _sum: {
            potentialAmount: true,
          },
        }),
        ctx.prisma.claim.aggregate({
          where: {
            ...claimsWhere,
            isCourtStage: true,
          },
          _sum: {
            potentialAmount: true,
          },
        }),
        ctx.prisma.payout.findMany({
          where: {
            receivedAt: {
              gte: dateFrom,
              lte: dateTo,
            },
            claim: {
              deletedAt: null,
            },
          },
          select: {
            claimId: true,
            amountRecovered: true,
            owemeFee: true,
            claim: {
              select: {
                airline: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
        ctx.prisma.claim.count({
          where: {
            deletedAt: null,
            status: ClaimStatus.WON,
            closedAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        }),
        ctx.prisma.claim.count({
          where: {
            deletedAt: null,
            status: ClaimStatus.REJECTED,
            closedAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        }),
        ctx.prisma.claim.count({
          where: {
            deletedAt: null,
            status: ClaimStatus.DISMISSED,
            closedAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        }),
      ]);

      const totalRecovered = payouts.reduce(
        (sum, payout) => sum + decimalToNumber(payout.amountRecovered),
        0,
      );
      const totalFees = payouts.reduce(
        (sum, payout) => sum + decimalToNumber(payout.owemeFee),
        0,
      );
      const byAirlineMap = new Map<
        string,
        {
          airlineName: string;
          claimIds: Set<string>;
          totalRecovered: number;
          totalFees: number;
        }
      >();

      for (const payout of payouts) {
        const airlineName = payout.claim.airline?.name ?? "Brak linii";
        const row =
          byAirlineMap.get(airlineName) ??
          {
            airlineName,
            claimIds: new Set<string>(),
            totalRecovered: 0,
            totalFees: 0,
          };

        row.claimIds.add(payout.claimId);
        row.totalRecovered += decimalToNumber(payout.amountRecovered);
        row.totalFees += decimalToNumber(payout.owemeFee);
        byAirlineMap.set(airlineName, row);
      }

      const denominator = wonCount + rejectedCount + dismissedCount;

      return {
        totalPotentialValue: decimalToNumber(
          potentialValue._sum.potentialAmount,
        ),
        totalRecovered,
        totalFees,
        avgFeePerClaim: payouts.length ? totalFees / payouts.length : 0,
        byAirline: Array.from(byAirlineMap.values())
          .map((row) => ({
            airlineName: row.airlineName,
            claimCount: row.claimIds.size,
            totalRecovered: row.totalRecovered,
            totalFees: row.totalFees,
          }))
          .sort((a, b) => b.totalRecovered - a.totalRecovered),
        courtStageValue: decimalToNumber(
          courtStageValue._sum.potentialAmount,
        ),
        successRate: denominator ? (wonCount / denominator) * 100 : 0,
      };
    }),

  salesKpis: permissionProcedure(PERMISSIONS.REPORT_SALES)
    .input(dateRangeInputSchema)
    .query(async ({ ctx, input }) => {
      const { dateFrom, dateTo } = normalizeDateRange(input);
      const claims = await ctx.prisma.claim.findMany({
        where: buildClaimPeriodWhere(dateFrom, dateTo),
        select: {
          source: true,
          status: true,
          qualifiedAt: true,
        },
      });

      const totalLeads = claims.length;
      const qualifiedClaims = claims.filter(isQualifiedClaim).length;
      const bySource = Object.values(ClaimSource).map((source) => {
        const sourceClaims = claims.filter((claim) => claim.source === source);
        const qualified = sourceClaims.filter(isQualifiedClaim).length;

        return {
          source,
          count: sourceClaims.length,
          qualified,
        };
      });

      return {
        totalLeads,
        qualifiedClaims,
        conversionRate: totalLeads ? (qualifiedClaims / totalLeads) * 100 : 0,
        bySource,
      };
    }),
});
