import {
  ClaimAmountCategory,
  ClaimSource,
  ClaimStatus,
  ClaimType,
  CommissionModel,
  DocumentStatus,
  DocumentType,
  Prisma,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth-helpers";
import type { Context } from "@/lib/trpc/context";
import { adminProcedure, protectedProcedure, router } from "@/lib/trpc/trpc";
import type { AppUser } from "@/types/auth";

const claimListInclude = {
  client: true,
  flight: true,
  airline: true,
  owner: true,
} satisfies Prisma.ClaimInclude;

const claimCardInclude = {
  client: true,
  flight: true,
  airline: true,
  owner: true,
  creator: true,
  passengers: {
    orderBy: {
      isPrimary: "desc",
    },
  },
  documents: {
    orderBy: {
      generatedAt: "desc",
    },
  },
  attachments: {
    orderBy: {
      createdAt: "desc",
    },
  },
  notes: {
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: true,
    },
  },
  tasks: {
    where: {
      status: {
        not: TaskStatus.DONE,
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    include: {
      assignee: true,
    },
  },
  statusHistory: {
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    include: {
      changedBy: true,
    },
  },
  payouts: true,
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

const listInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(25),
    search: z.string().trim().optional(),
    status: z.array(claimStatusSchema).optional(),
    ownerId: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    claimType: z.array(claimTypeSchema).optional(),
    isCourtStage: z.boolean().optional(),
    overdueTasks: z.boolean().optional(),
    airlineId: z.string().optional(),
    source: z.array(claimSourceSchema).optional(),
  })
  .default({
    page: 1,
    pageSize: 25,
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
  closeReason: z.string().trim().nullable().optional(),
});

const deleteInputSchema = z.object({
  id: z.string().min(1),
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

  if (input.status?.length) {
    where.status = { in: input.status };
  }

  if (input.ownerId) {
    where.ownerId = input.ownerId;
  }

  if (input.dateFrom || input.dateTo) {
    where.flight = {
      is: {
        flightDate: {
          ...(input.dateFrom ? { gte: input.dateFrom } : {}),
          ...(input.dateTo ? { lte: input.dateTo } : {}),
        },
      },
    };
  }

  if (input.claimType?.length) {
    where.type = { in: input.claimType };
  }

  if (typeof input.isCourtStage === "boolean") {
    where.isCourtStage = input.isCourtStage;
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

  return where;
}

function calculateClaimAmounts(
  amountCategory: ClaimAmountCategory | null,
  commissionModel: CommissionModel,
) {
  const amountByCategory: Record<ClaimAmountCategory, number> = {
    EUR_250: 250,
    EUR_400: 400,
    EUR_600: 600,
  };

  if (!amountCategory) {
    return {
      potentialAmount: null,
      estimatedFee: null,
    };
  }

  const potentialAmount = amountByCategory[amountCategory];
  const feeRate = commissionModel === CommissionModel.COURT_40 ? 0.4 : 0.3;

  return {
    potentialAmount: new Prisma.Decimal(potentialAmount),
    estimatedFee: new Prisma.Decimal(potentialAmount * feeRate),
  };
}

async function generateClaimNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const prefix = `OW-${year}-`;
  const lastClaim = await tx.claim.findFirst({
    where: {
      claimNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      claimNumber: "desc",
    },
    select: {
      claimNumber: true,
    },
  });
  const lastNumber = lastClaim?.claimNumber.split("-").at(-1);
  const nextNumber = (lastNumber ? Number.parseInt(lastNumber, 10) : 0) + 1;

  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
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

export const claimsRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    requireAppUser(ctx);

    const page = input.page;
    const pageSize = input.pageSize;
    const where = buildListWhere(input);
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

  getById: protectedProcedure
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

  create: protectedProcedure
    .input(createInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      const claim = await ctx.prisma.$transaction(async (tx) => {
        const flight = input.flightId
          ? await tx.flight.findUnique({
              where: { id: input.flightId },
              select: {
                amountCategory: true,
                airlineId: true,
              },
            })
          : null;

        const { potentialAmount, estimatedFee } = calculateClaimAmounts(
          flight?.amountCategory ?? null,
          CommissionModel.STANDARD_30,
        );
        const claimNumber = await generateClaimNumber(tx);

        const createdClaim = await tx.claim.create({
          data: {
            claimNumber,
            type: input.type,
            source: input.source,
            status: ClaimStatus.NEW,
            creatorId: appUser.id,
            clientId: input.clientId,
            flightId: input.flightId,
            airlineId: input.airlineId ?? flight?.airlineId,
            potentialAmount,
            estimatedFee,
            commissionModel: CommissionModel.STANDARD_30,
            isPolishJurisdiction: input.isPolishJurisdiction,
          },
          include: claimCardInclude,
        });

        await tx.claimStatusHistory.create({
          data: {
            claimId: createdClaim.id,
            changedById: appUser.id,
            oldStatus: ClaimStatus.NEW,
            newStatus: ClaimStatus.NEW,
            comment: "Utworzono sprawę.",
          },
        });

        return createdClaim;
      });

      return claim;
    }),

  updateStatus: protectedProcedure
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
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      await validateStatusTransition(ctx, claim, input.status);

      return ctx.prisma.$transaction(async (tx) => {
        const updatedClaim = await tx.claim.update({
          where: { id: input.id },
          data: {
            status: input.status,
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
    }),

  assignOwner: protectedProcedure
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

  update: protectedProcedure
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

  delete: adminProcedure.input(deleteInputSchema).mutation(async ({ ctx, input }) => {
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
