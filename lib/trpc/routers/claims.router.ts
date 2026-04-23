import {
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

import { sendClaimRegisteredEmail } from "@/lib/email/claim-emails";
import { hasPermission } from "@/lib/auth-helpers";
import { claimCardInclude, createClaimWithHistory } from "@/lib/claims/create-claim";
import { sendInngestEvent } from "@/lib/inngest/events";
import type { Context } from "@/lib/trpc/context";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";
import type { AppUser } from "@/types/auth";

const claimListInclude = {
  client: true,
  flight: true,
  airline: true,
  owner: true,
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
  list: permissionProcedure(PERMISSIONS.CLAIM_READ_ALL).input(listInputSchema).query(async ({ ctx, input }) => {
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
        sendClaimRegisteredEmail(claim.id).catch((error) => {
          console.error(
            "[Email] Nie udało się wysłać potwierdzenia przyjęcia sprawy.",
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

      await sendInngestEvent({
        name: "claim/status-changed",
        data: {
          claimId: input.id,
          oldStatus: claim.status,
          newStatus: input.status,
        },
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
