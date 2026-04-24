import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { fetchFlightData } from "@/lib/services/flight-data.service";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/trpc";

const flightNumberSchema = z
  .string()
  .trim()
  .min(3)
  .regex(/^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i, {
    message: "Numer lotu ma nieprawidłowy format.",
  })
  .transform((value) => value.replace(/\s+/g, "").toUpperCase());

const flightDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Data lotu musi mieć format YYYY-MM-DD.",
});

const searchInputSchema = z.object({
  flightNumber: flightNumberSchema,
  date: flightDateSchema,
});

const refreshInputSchema = z.object({
  flightId: z.string().min(1),
});

const getByIdInputSchema = z.object({
  id: z.string().min(1),
});

function formatFlightDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const flightsRouter = router({
  searchPublic: publicProcedure
    .input(searchInputSchema)
    .query(async ({ input }) => {
      return fetchFlightData(input.flightNumber, input.date);
    }),

  search: publicProcedure.input(searchInputSchema).query(async ({ input }) => {
    return fetchFlightData(input.flightNumber, input.date);
  }),

  refresh: protectedProcedure
    .input(refreshInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.appUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
        });
      }

      const flight = await ctx.prisma.flight.findUnique({
        where: {
          id: input.flightId,
        },
        select: {
          flightNumber: true,
          flightDate: true,
        },
      });

      if (!flight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono lotu.",
        });
      }

      return fetchFlightData(flight.flightNumber, formatFlightDate(flight.flightDate), {
        forceRefresh: true,
      });
    }),

  getById: protectedProcedure
    .input(getByIdInputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.appUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
        });
      }

      const flight = await ctx.prisma.flight.findUnique({
        where: {
          id: input.id,
        },
        include: {
          airline: true,
          claims: {
            select: {
              id: true,
              claimNumber: true,
              status: true,
              client: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!flight) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono lotu.",
        });
      }

      return flight;
    }),
});
