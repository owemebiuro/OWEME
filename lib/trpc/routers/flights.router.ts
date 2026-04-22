import { FlightStatus, ClaimAmountCategory } from "@prisma/client";
import { z } from "zod";

import { publicProcedure, router } from "@/lib/trpc/trpc";

const AMOUNT_MAP: Record<ClaimAmountCategory, number> = {
  EUR_250: 250,
  EUR_400: 400,
  EUR_600: 600,
};

export const flightsRouter = router({
  search: publicProcedure
    .input(
      z.object({
        flightNumber: z.string().min(2).max(10),
        flightDate: z.coerce.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const fn = input.flightNumber.trim().toUpperCase().replace(/\s+/g, "");
      const date = input.flightDate;
      const dayStart = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      const dayEnd = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
      );

      const flight = await ctx.prisma.flight.findFirst({
        where: {
          flightNumber: fn,
          flightDate: { gte: dayStart, lt: dayEnd },
        },
        include: { airline: true },
      });

      if (!flight) return null;

      const amountPerPassenger = flight.amountCategory
        ? AMOUNT_MAP[flight.amountCategory]
        : null;

      const isEligible =
        amountPerPassenger !== null &&
        ((flight.delayMinutes !== null && flight.delayMinutes >= 180) ||
          flight.flightStatus === FlightStatus.CANCELLED);

      let ineligibilityReason: string | null = null;
      if (!isEligible) {
        if (flight.delayMinutes !== null && flight.delayMinutes < 180) {
          ineligibilityReason = `Opóźnienie wynosiło ${flight.delayMinutes} min, minimalne to 180 min (3h).`;
        } else if (flight.flightStatus === FlightStatus.CANCELLED) {
          ineligibilityReason = "Lot odwołany — warunki nie spełniają kryteriów EU 261/2004.";
        } else {
          ineligibilityReason = "Lot nie spełnia kryteriów odszkodowania EU 261/2004.";
        }
      }

      return {
        id: flight.id,
        flightNumber: flight.flightNumber,
        route: `${flight.departureAirportCode} → ${flight.arrivalAirportCode}`,
        departureAirport: flight.departureAirportCode,
        arrivalAirport: flight.arrivalAirportCode,
        delayMinutes: flight.delayMinutes,
        flightStatus: flight.flightStatus,
        amountCategory: flight.amountCategory,
        amountPerPassenger,
        isEligible,
        ineligibilityReason,
        airlineName: flight.airline.name,
      };
    }),
});
