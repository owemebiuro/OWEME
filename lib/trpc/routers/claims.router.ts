import {
  type ClaimAmountCategory,
  ClaimSource,
  ClaimStatus,
  ClaimType,
  CommissionModel,
  DocumentStatus,
  DocumentType,
  Prisma,
  SettlementStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth-helpers";
import {
  calculateClaimAmounts,
  claimCardInclude,
  createClaimWithHistory,
  resolveClaimAmountCategory,
} from "@/lib/claims/create-claim";
import { JUDICIAL_STATUSES } from "@/lib/constants/statuses";
import { sendInngestEvent } from "@/lib/inngest/events";
import { computeLimitation, extractComplaintDates } from "@/lib/limitation/limitation";
import type { Context } from "@/lib/trpc/context";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";
import { emitEvent } from "@/src/server/events";
import type { AppUser } from "@/types/auth";

const claimListInclude = {
  client: true,
  flight: true,
  airline: true,
  owner: true,
  statusHistory: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      newStatus: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ClaimInclude;

const claimStatusSchema = z.enum(ClaimStatus);
const claimTypeSchema = z.enum(ClaimType);
const claimSourceSchema = z.enum(ClaimSource);
const commissionModelSchema = z.enum(CommissionModel);
const closedStatuses: readonly ClaimStatus[] = [
  ClaimStatus.CLOSED_PAID,
  ClaimStatus.REJECTED,
  ClaimStatus.DISMISSED,
];

const TERMINAL_STATUSES: ClaimStatus[] = [
  ClaimStatus.WON,
  ClaimStatus.SETTLEMENT,
  ClaimStatus.CLOSED_PAID,
  ClaimStatus.REJECTED,
  ClaimStatus.DISMISSED,
];

const listInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(25),
    search: z.string().trim().optional(),
    flightNumber: z.string().trim().optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    status: z.array(claimStatusSchema).optional(),
    ownerId: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    view: z.enum(["all", "extrajudicial", "judicial"]).optional(),
    claimType: z.array(claimTypeSchema).optional(),
    isCourtStage: z.boolean().optional(),
    overdueTasks: z.boolean().optional(),
    airlineId: z.string().optional(),
    source: z.array(claimSourceSchema).optional(),
    archived: z.boolean().default(false),
    limitationSort: z.enum(["asc", "desc"]).optional(),
  })
  .default({
    page: 1,
    pageSize: 25,
    archived: false,
  });

const getByIdInputSchema = z.object({
  id: z.string().min(1),
});

const createInputSchema = z.object({
  type: claimTypeSchema,
  source: claimSourceSchema,
  clientId: z.string().min(1),
  flightId: z.string().min(1).optional(),
  airlineId: z.string().min(1).optional(),
  isPolishJurisdiction: z.boolean(),
});

const updateStatusInputSchema = z.object({
  id: z.string().min(1),
  status: claimStatusSchema,
  comment: z.string().trim().optional(),
});

const assignOwnerInputSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1).nullable(),
});

const updateInputSchema = z.object({
  id: z.string().min(1),
  type: claimTypeSchema.optional(),
  source: claimSourceSchema.optional(),
  subStatus: z.string().trim().nullable().optional(),
  clientId: z.string().min(1).optional(),
  flightId: z.string().min(1).nullable().optional(),
  airlineId: z.string().min(1).nullable().optional(),
  potentialAmount: z.coerce.number().nonnegative().nullable().optional(),
  estimatedFee: z.coerce.number().nonnegative().nullable().optional(),
  commissionModel: commissionModelSchema.optional(),
  isCourtStage: z.boolean().optional(),
  isPolishJurisdiction: z.boolean().optional(),
  dataCompleteness: z.number().int().min(0).max(100).optional(),
  signatureFirst: z.string().trim().nullable().optional(),
  signatureSecond: z.string().trim().nullable().optional(),
  courtName: z.string().trim().nullable().optional(),
  closeReason: z.string().trim().nullable().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().min(1),
});

const updateBillingInputSchema = z.object({
  id: z.string().min(1),
  airlinePaid: z.boolean().optional(),
  airlinePaidAt: z.coerce.date().nullable().optional(),
  clientPaid: z.boolean().optional(),
  clientPaidAt: z.coerce.date().nullable().optional(),
  clientIban: z.string().trim().nullable().optional(),
  transferTitle: z.string().trim().nullable().optional(),
  clientSettled: z.boolean().optional(),
});

const createSettlementInputSchema = z.object({
  claimId: z.string().min(1),
  airlineAmountEur: z.coerce.number().positive(),
  eurPlnRate: z.coerce.number().positive(),
  airlineAmountPln: z.coerce.number().nonnegative(),
  companySharePln: z.coerce.number().nonnegative(),
  clientSharePln: z.coerce.number().nonnegative(),
  courtCosts: z.coerce.number().nonnegative().nullable().optional(),
  courtCostsPaid: z.boolean().optional(),
});

function requireAppUser(ctx: Context): AppUser {
  if (!ctx.appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  return ctx.appUser;
}

function buildSearchWhere(search: string): Prisma.ClaimWhereInput {
  const contains = {
    contains: search,
    mode: "insensitive" as const,
  };

  return {
    OR: [
      { claimNumber: contains },
      { client: { is: { firstName: contains } } },
      { client: { is: { lastName: contains } } },
      { client: { is: { email: contains } } },
      { client: { is: { phone: contains } } },
      { flight: { is: { flightNumber: contains } } },
    ],
  };
}

function buildListWhere(
  input: z.infer<typeof listInputSchema>,
): Prisma.ClaimWhereInput {
  const where: Prisma.ClaimWhereInput = {
    deletedAt: null,
  };

  if (input.search) {
    Object.assign(where, buildSearchWhere(input.search));
  }

  const and: Prisma.ClaimWhereInput[] = [];

  if (input.flightNumber) {
    and.push({
      flight: {
        is: {
          flightNumber: {
            contains: input.flightNumber,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (input.firstName) {
    and.push({
      client: {
        is: {
          firstName: {
            contains: input.firstName,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (input.lastName) {
    and.push({
      client: {
        is: {
          lastName: {
            contains: input.lastName,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (input.phone) {
    and.push({
      client: {
        is: {
          phone: {
            contains: input.phone,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (input.email) {
    and.push({
      client: {
        is: {
          email: {
            contains: input.email,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (input.status?.length) {
    where.status = { in: input.status };
  } else if (input.archived) {
    where.status = { in: TERMINAL_STATUSES };
  } else {
    where.status = { notIn: TERMINAL_STATUSES };
  }

  if (input.ownerId) {
    where.ownerId = input.ownerId;
  }

  if (input.dateFrom || input.dateTo) {
    where.createdAt = {
      ...(input.dateFrom ? { gte: input.dateFrom } : {}),
      ...(input.dateTo ? { lte: input.dateTo } : {}),
    };
  }

  if (input.claimType?.length) {
    where.type = { in: input.claimType };
  }

  if (typeof input.isCourtStage === "boolean") {
    where.isCourtStage = input.isCourtStage;
  }

  if (input.view === "judicial") {
    and.push({ status: { in: [...JUDICIAL_STATUSES] } });
  } else if (input.view === "extrajudicial") {
    and.push({ status: { notIn: [...JUDICIAL_STATUSES] } });
  }

  if (input.overdueTasks) {
    where.tasks = {
      some: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
        },
      },
    };
  }

  if (input.airlineId) {
    where.airlineId = input.airlineId;
  }

  if (input.source?.length) {
    where.source = { in: input.source };
  }

  if (and.length) {
    where.AND = and;
  }

  return where;
}

function computeClaimListLimitation(
  claim: Prisma.ClaimGetPayload<{ include: typeof claimListInclude }>,
) {
  const flightDate = new Date(claim.flight?.flightDate ?? claim.createdAt);
  const { complaintFiledAt, complaintAnsweredAt } = extractComplaintDates(
    claim.statusHistory.map((entry) => ({
      status: entry.newStatus,
      createdAt: entry.createdAt,
    })),
  );

  return computeLimitation(flightDate, complaintFiledAt, complaintAnsweredAt);
}

function sortClaimsByLimitation(
  claims: Array<Prisma.ClaimGetPayload<{ include: typeof claimListInclude }>>,
  direction: "asc" | "desc",
) {
  return [...claims].sort((first, second) => {
    const firstLimitation = computeClaimListLimitation(first);
    const secondLimitation = computeClaimListLimitation(second);
    const byExpiry =
      firstLimitation.finalExpiryDate.getTime() -
      secondLimitation.finalExpiryDate.getTime();

    if (byExpiry !== 0) {
      return direction === "asc" ? byExpiry : -byExpiry;
    }

    return second.createdAt.getTime() - first.createdAt.getTime();
  });
}

async function validateStatusTransition(
  ctx: Context,
  claim: Prisma.ClaimGetPayload<{
    include: {
      documents: true;
      payouts: true;
    };
  }>,
  nextStatus: ClaimStatus,
) {
  const appUser = requireAppUser(ctx);

  if (
    nextStatus === ClaimStatus.DEMAND_LETTER_SENT &&
    !claim.documents.some(
      (document) =>
        document.type === DocumentType.ASSIGNMENT_AGREEMENT &&
        document.status === DocumentStatus.SIGNED,
    )
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Nie można wysłać wezwania bez podpisanej umowy cesji.",
    });
  }

  if (
    nextStatus === ClaimStatus.SETTLEMENT &&
    !claim.payouts.some((payout) => payout.amountRecovered.gt(0))
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Nie można przejść do ugody bez zarejestrowanej wypłaty.",
    });
  }

  if (
    nextStatus === ClaimStatus.QUALIFIED &&
    claim.isPolishJurisdiction === false
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Nie można zakwalifikować sprawy poza polską jurysdykcją.",
    });
  }

  if (
    nextStatus === ClaimStatus.COURT_STAGE &&
    appUser.role === UserRole.OPERATOR
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Operator nie może przenieść sprawy do etapu sądowego.",
    });
  }
}

function getClosedAtPatch(status: ClaimStatus) {
  if (closedStatuses.includes(status)) {
    return { closedAt: new Date() };
  }

  return {};
}

function getAnalysisAmountPatch(
  claim: {
    status: ClaimStatus;
    applicationPayload: Prisma.JsonValue | null;
    flight: {
      departureAirportCode: string;
      arrivalAirportCode: string;
      amountCategory: ClaimAmountCategory | null;
    } | null;
  },
  nextStatus: ClaimStatus,
  nextCommissionModel: CommissionModel,
) {
  if (
    claim.status !== ClaimStatus.AWAITING_VERIFICATION ||
    nextStatus === ClaimStatus.AWAITING_VERIFICATION
  ) {
    return {};
  }

  const amountCategory = resolveClaimAmountCategory({
    flight: claim.flight,
    applicationPayload: claim.applicationPayload,
  });

  return amountCategory
    ? calculateClaimAmounts(amountCategory, nextCommissionModel)
    : {};
}

export const claimsRouter = router({
  list: permissionProcedure(PERMISSIONS.CLAIM_READ_ALL).input(listInputSchema).query(async ({ ctx, input }) => {
    requireAppUser(ctx);

    const page = input.page;
    const pageSize = input.pageSize;
    const where = buildListWhere(input);

    if (input.limitationSort) {
      const [allItems, total] = await ctx.prisma.$transaction([
        ctx.prisma.claim.findMany({
          where,
          include: claimListInclude,
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.prisma.claim.count({ where }),
      ]);
      const sortedItems = sortClaimsByLimitation(
        allItems,
        input.limitationSort,
      );
      const start = (page - 1) * pageSize;

      return {
        items: sortedItems.slice(start, start + pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const [items, total] = await ctx.prisma.$transaction([
      ctx.prisma.claim.findMany({
        where,
        include: claimListInclude,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      ctx.prisma.claim.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

  getById: permissionProcedure(PERMISSIONS.CLAIM_READ_ALL)
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      requireAppUser(ctx);

      const claim = await ctx.prisma.claim.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
        include: claimCardInclude,
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      return claim;
    }),

  create: permissionProcedure(PERMISSIONS.CLAIM_CREATE)
    .input(createInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      const claim = await createClaimWithHistory(ctx.prisma, {
        type: input.type,
        source: input.source,
        clientId: input.clientId,
        creatorId: appUser.id,
        flightId: input.flightId,
        airlineId: input.airlineId,
        isPolishJurisdiction: input.isPolishJurisdiction,
      });

      await Promise.all([
        sendInngestEvent({
          name: "claim/created",
          data: {
            claimId: claim.id,
          },
        }),
        emitEvent("claim.created", {
          claimId: claim.id,
        }).catch((error) => {
          console.error(
            "[MAIL_ERROR] Nie udało się obsłużyć eventu claim.created.",
            {
              claimId: claim.id,
              error,
            },
          );
        }),
      ]);

      return claim;
    }),

  updateStatus: permissionProcedure(PERMISSIONS.CLAIM_CHANGE_STATUS)
    .input(updateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      const claim = await ctx.prisma.claim.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
        include: {
          documents: true,
          payouts: true,
          flight: {
            select: {
              departureAirportCode: true,
              arrivalAirportCode: true,
              amountCategory: true,
            },
          },
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      await validateStatusTransition(ctx, claim, input.status);

      const updatedClaim = await ctx.prisma.$transaction(async (tx) => {
        const nextIsJudicialStage = JUDICIAL_STATUSES.includes(input.status);
        const nextCommissionModel = nextIsJudicialStage
          ? CommissionModel.COURT_40
          : CommissionModel.STANDARD_30;
        const updatedClaim = await tx.claim.update({
          where: { id: input.id },
          data: {
            status: input.status,
            isCourtStage: nextIsJudicialStage,
            commissionModel: nextCommissionModel,
            ...getAnalysisAmountPatch(claim, input.status, nextCommissionModel),
            ...(input.status === ClaimStatus.QUALIFIED
              ? { qualifiedAt: new Date() }
              : {}),
            ...getClosedAtPatch(input.status),
          },
          include: claimCardInclude,
        });

        await tx.claimStatusHistory.create({
          data: {
            claimId: input.id,
            changedById: appUser.id,
            oldStatus: claim.status,
            newStatus: input.status,
            comment: input.comment,
          },
        });

        return updatedClaim;
      });

      await sendInngestEvent({
        name: "claim/status-changed",
        data: {
          claimId: input.id,
          oldStatus: claim.status,
          newStatus: input.status,
        },
      });

      await emitEvent("claim.status.changed", {
        claimId: input.id,
        oldStatus: claim.status,
        newStatus: input.status,
        actorId: appUser.id,
      });

      return updatedClaim;
    }),

  assignOwner: permissionProcedure(PERMISSIONS.CLAIM_ASSIGN_OWNER)
    .input(assignOwnerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      if (appUser.role === UserRole.OPERATOR && input.ownerId !== appUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Operator może przypisać sprawę tylko do siebie.",
        });
      }

      if (
        appUser.role !== UserRole.ADMIN &&
        appUser.role !== UserRole.OPERATOR
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do przypisywania spraw.",
        });
      }

      const claim = await ctx.prisma.claim.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
        select: {
          ownerId: true,
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      if (input.ownerId) {
        const owner = await ctx.prisma.user.findFirst({
          where: {
            id: input.ownerId,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        if (!owner) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Wybrany właściciel sprawy nie istnieje.",
          });
        }
      }

      return ctx.prisma.$transaction(async (tx) => {
        const updatedClaim = await tx.claim.update({
          where: { id: input.id },
          data: {
            ownerId: input.ownerId,
          },
          include: claimCardInclude,
        });

        await tx.assignmentHistory.create({
          data: {
            claimId: input.id,
            changedById: appUser.id,
            previousOwnerId: claim.ownerId,
            newOwnerId: input.ownerId,
          },
        });

        return updatedClaim;
      });
    }),

  update: permissionProcedure(PERMISSIONS.CLAIM_EDIT)
    .input(updateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      if (!hasPermission(appUser, "crm:write")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do edycji spraw.",
        });
      }

      if (
        appUser.role === UserRole.OPERATOR &&
        input.commissionModel !== undefined
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Operator nie może zmieniać modelu prowizji.",
        });
      }

      const { id, ...data } = input;
      const claim = await ctx.prisma.claim.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      return ctx.prisma.claim.update({
        where: { id },
        data: {
          ...data,
          potentialAmount:
            data.potentialAmount === undefined
              ? undefined
              : data.potentialAmount === null
                ? null
                : new Prisma.Decimal(data.potentialAmount),
          estimatedFee:
            data.estimatedFee === undefined
              ? undefined
              : data.estimatedFee === null
                ? null
                : new Prisma.Decimal(data.estimatedFee),
        },
        include: claimListInclude,
      });
    }),

  updateBilling: permissionProcedure(PERMISSIONS.BILLING_EDIT)
    .input(updateBillingInputSchema)
    .mutation(async ({ ctx, input }) => {
      requireAppUser(ctx);

      const { id, ...data } = input;
      const claim = await ctx.prisma.claim.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      return ctx.prisma.claim.update({
        where: { id },
        data,
        select: { id: true },
      });
    }),

  createSettlement: permissionProcedure(PERMISSIONS.BILLING_EDIT)
    .input(createSettlementInputSchema)
    .mutation(async ({ ctx, input }) => {
      requireAppUser(ctx);

      const claim = await ctx.prisma.claim.findFirst({
        where: { id: input.claimId, deletedAt: null },
        select: {
          id: true,
          status: true,
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      const commissionModel = JUDICIAL_STATUSES.includes(claim.status)
        ? CommissionModel.COURT_40
        : CommissionModel.STANDARD_30;

      return ctx.prisma.payout.create({
        data: {
          claimId: claim.id,
          amountRecovered: new Prisma.Decimal(input.airlineAmountPln),
          currency: "PLN",
          receivedAt: new Date(),
          owemeFee: new Prisma.Decimal(input.companySharePln),
          commissionModel,
          clientAmount: new Prisma.Decimal(input.clientSharePln),
          status: SettlementStatus.RECEIVED,
          airlinePaymentAmount: new Prisma.Decimal(input.airlineAmountEur),
          clientPaymentAmount: new Prisma.Decimal(input.clientSharePln),
          courtCosts:
            input.courtCosts === undefined || input.courtCosts === null
              ? null
              : new Prisma.Decimal(input.courtCosts),
          courtCostsPaid: input.courtCostsPaid ?? false,
          eurPlnRate: new Prisma.Decimal(input.eurPlnRate),
          companyShare: new Prisma.Decimal(input.companySharePln),
          clientShare: new Prisma.Decimal(input.clientSharePln),
          calculatedAt: new Date(),
        },
      });
    }),

  delete: permissionProcedure(PERMISSIONS.CLAIM_DELETE).input(deleteInputSchema).mutation(async ({ ctx, input }) => {
    const claim = await ctx.prisma.claim.findFirst({
      where: {
        id: input.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!claim) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Nie znaleziono sprawy.",
      });
    }

    return ctx.prisma.claim.update({
      where: { id: input.id },
      data: {
        deletedAt: new Date(),
      },
      include: claimListInclude,
    });
  }),
});
