import { ClaimStatus, Prisma, TaskStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import type { Context } from "@/lib/trpc/context";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/trpc";
import type { AppUser } from "@/types/auth";

const finalClaimStatuses = [
  ClaimStatus.CLOSED_PAID,
  ClaimStatus.REJECTED,
  ClaimStatus.DISMISSED,
] as const;

const closedThisMonthStatuses = [
  ClaimStatus.CLOSED_PAID,
  ClaimStatus.REJECTED,
  ClaimStatus.DISMISSED,
] as const;

function requireAppUser(ctx: Context): AppUser {
  if (!ctx.appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  return ctx.appUser;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function startOfCurrentMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export const dashboardRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { ok: true } as const;
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const appUser = requireAppUser(ctx);
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const monthStart = startOfCurrentMonth();
    const activeClaimsWhere: Prisma.ClaimWhereInput = {
      deletedAt: null,
      status: {
        notIn: [...finalClaimStatuses],
      },
    };

    const [
      newClaims,
      awaitingVerification,
      actionRequiredToday,
      overdue,
      myClaims,
      courtStage,
      totalPotentialValue,
      wonThisMonth,
      closedThisMonth,
    ] = await ctx.prisma.$transaction([
      ctx.prisma.claim.count({
        where: {
          deletedAt: null,
          status: ClaimStatus.NEW,
        },
      }),
      ctx.prisma.claim.count({
        where: {
          deletedAt: null,
          status: ClaimStatus.AWAITING_VERIFICATION,
        },
      }),
      ctx.prisma.task.count({
        where: {
          status: TaskStatus.OPEN,
          dueDate: {
            lte: todayEnd,
          },
          claim: {
            deletedAt: null,
          },
        },
      }),
      ctx.prisma.task.count({
        where: {
          status: TaskStatus.OPEN,
          dueDate: {
            lt: todayStart,
          },
          claim: {
            deletedAt: null,
          },
        },
      }),
      ctx.prisma.claim.count({
        where: {
          deletedAt: null,
          ownerId: appUser.id,
        },
      }),
      ctx.prisma.claim.count({
        where: {
          deletedAt: null,
          isCourtStage: true,
        },
      }),
      ctx.prisma.claim.aggregate({
        where: activeClaimsWhere,
        _sum: {
          potentialAmount: true,
        },
      }),
      ctx.prisma.claim.count({
        where: {
          deletedAt: null,
          status: ClaimStatus.WON,
          closedAt: {
            gte: monthStart,
            lte: new Date(),
          },
        },
      }),
      ctx.prisma.claim.count({
        where: {
          deletedAt: null,
          status: {
            in: [...closedThisMonthStatuses],
          },
          closedAt: {
            gte: monthStart,
            lte: new Date(),
          },
        },
      }),
    ]);

    return {
      newClaims,
      awaitingVerification,
      actionRequiredToday,
      overdue,
      myClaims,
      courtStage,
      totalPotentialValue: decimalToNumber(
        totalPotentialValue._sum.potentialAmount,
      ),
      wonThisMonth,
      closedThisMonth,
    };
  }),

  myTasks: protectedProcedure.query(async ({ ctx }) => {
    const appUser = requireAppUser(ctx);

    return ctx.prisma.task.findMany({
      where: {
        assigneeId: appUser.id,
        status: TaskStatus.OPEN,
        claim: {
          deletedAt: null,
        },
      },
      orderBy: [
        {
          dueDate: {
            sort: "asc",
            nulls: "last",
          },
        },
        {
          createdAt: "desc",
        },
      ],
      take: 10,
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        claim: {
          select: {
            id: true,
            claimNumber: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }),

  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    requireAppUser(ctx);

    const activity = await ctx.prisma.claimStatusHistory.findMany({
      where: {
        claim: {
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        oldStatus: true,
        newStatus: true,
        comment: true,
        createdAt: true,
        claim: {
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
        },
        changedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return activity.map((event) => ({
      type: "STATUS_CHANGE" as const,
      id: event.id,
      claim: event.claim,
      user: event.changedBy,
      description: `Zmiana statusu: ${event.oldStatus} -> ${event.newStatus}`,
      comment: event.comment,
      createdAt: event.createdAt,
    }));
  }),
});
