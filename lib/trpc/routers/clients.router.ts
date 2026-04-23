import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth-helpers";
import type { Context } from "@/lib/trpc/context";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const clientListInclude = {
  _count: {
    select: {
      claims: true,
    },
  },
} satisfies Prisma.ClientInclude;

const clientCardInclude = {
  _count: {
    select: {
      claims: true,
    },
  },
  claims: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      claimNumber: true,
      status: true,
      type: true,
      createdAt: true,
      potentialAmount: true,
      airline: {
        select: {
          name: true,
          iataCode: true,
        },
      },
      flight: {
        select: {
          flightNumber: true,
          flightDate: true,
        },
      },
    },
  },
} satisfies Prisma.ClientInclude;

const listInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(25),
    search: z.string().trim().optional(),
  })
  .default({
    page: 1,
    pageSize: 25,
  });

const getByIdInputSchema = z.object({
  id: z.string().min(1),
});

const clientFormSchema = z.object({
  firstName: z.string().trim().min(1, "Imię jest wymagane."),
  lastName: z.string().trim().min(1, "Nazwisko jest wymagane."),
  email: z.string().trim().email("Podaj poprawny email.").toLowerCase(),
  phone: z.string().trim().min(3).nullable().optional(),
  nationality: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  postalCode: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  country: z.string().trim().min(2).default("PL"),
  idDocumentNumber: z.string().trim().nullable().optional(),
  status: z.string().trim().min(1).default("ACTIVE"),
});

const createInputSchema = clientFormSchema;
const updateInputSchema = clientFormSchema.partial().extend({
  id: z.string().min(1),
});

const searchInputSchema = z.object({
  query: z.string().trim().min(1),
});

function requireAppUser(ctx: Context) {
  if (!ctx.appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  return ctx.appUser;
}

function buildSearchWhere(search: string): Prisma.ClientWhereInput {
  const contains = {
    contains: search,
    mode: "insensitive" as const,
  };

  return {
    OR: [
      { firstName: contains },
      { lastName: contains },
      { email: contains },
      { phone: contains },
    ],
  };
}

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value?.trim() || null;
}

export const clientsRouter = router({
  list: permissionProcedure(PERMISSIONS.CLIENT_READ).input(listInputSchema).query(async ({ ctx, input }) => {
    requireAppUser(ctx);

    const page = input.page;
    const pageSize = input.pageSize;
    const where: Prisma.ClientWhereInput = input.search
      ? buildSearchWhere(input.search)
      : {};

    const [items, total] = await ctx.prisma.$transaction([
      ctx.prisma.client.findMany({
        where,
        include: clientListInclude,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      ctx.prisma.client.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

  getById: permissionProcedure(PERMISSIONS.CLIENT_READ)
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      requireAppUser(ctx);

      const client = await ctx.prisma.client.findUnique({
        where: {
          id: input.id,
        },
        include: clientCardInclude,
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono klienta.",
        });
      }

      return client;
    }),

  create: permissionProcedure(PERMISSIONS.CLIENT_EDIT)
    .input(createInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      if (!hasPermission(appUser, "crm:write")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do tworzenia klientów.",
        });
      }

      const existingClient = await ctx.prisma.client.findFirst({
        where: {
          email: {
            equals: input.email,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

      if (existingClient) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Klient z tym adresem email już istnieje.",
        });
      }

      return ctx.prisma.client.create({
        data: {
          ...input,
          phone: normalizeNullableString(input.phone),
          nationality: normalizeNullableString(input.nationality),
          address: normalizeNullableString(input.address),
          postalCode: normalizeNullableString(input.postalCode),
          city: normalizeNullableString(input.city),
          idDocumentNumber: normalizeNullableString(input.idDocumentNumber),
        },
        include: clientCardInclude,
      });
    }),

  update: permissionProcedure(PERMISSIONS.CLIENT_EDIT)
    .input(updateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      if (!hasPermission(appUser, "crm:write")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do edycji klientów.",
        });
      }

      const { id, ...data } = input;
      const client = await ctx.prisma.client.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono klienta.",
        });
      }

      if (data.email) {
        const duplicate = await ctx.prisma.client.findFirst({
          where: {
            id: {
              not: id,
            },
            email: {
              equals: data.email,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Inny klient ma już ten adres email.",
          });
        }
      }

      return ctx.prisma.client.update({
        where: { id },
        data: {
          ...data,
          phone: normalizeNullableString(data.phone),
          nationality: normalizeNullableString(data.nationality),
          address: normalizeNullableString(data.address),
          postalCode: normalizeNullableString(data.postalCode),
          city: normalizeNullableString(data.city),
          idDocumentNumber: normalizeNullableString(data.idDocumentNumber),
        },
        include: clientCardInclude,
      });
    }),

  search: permissionProcedure(PERMISSIONS.CLIENT_READ)
    .input(searchInputSchema)
    .query(async ({ ctx, input }) => {
      requireAppUser(ctx);

      return ctx.prisma.client.findMany({
        where: buildSearchWhere(input.query),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 10,
      });
    }),
});
