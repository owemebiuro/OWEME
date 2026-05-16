import { ClaimAmountCategory } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  amountToCategory,
  estimateAmountCategoryFromRoute,
  resolveClaimAmountCategory,
} from "@/lib/claims/create-claim";

describe("claim amount estimation", () => {
  it("uses route distance instead of delay to choose the compensation tier", () => {
    const result = estimateAmountCategoryFromRoute({
      departureAirportCode: "WRO",
      arrivalAirportCode: "FRA",
    });

    expect(result.amountCategory).toBe(ClaimAmountCategory.EUR_250);
    expect(result.distanceKm).toBeGreaterThan(0);
  });

  it("falls back to the form estimate when the route cannot be resolved", () => {
    const category = resolveClaimAmountCategory({
      flight: {
        departureAirportCode: "WAW",
        arrivalAirportCode: "ING",
        amountCategory: ClaimAmountCategory.EUR_600,
      },
      applicationPayload: {
        SZACOWANA_KWOTA_EUR: 400,
      },
    });

    expect(category).toBe(ClaimAmountCategory.EUR_400);
  });

  it("maps supported EUR amounts to claim amount categories", () => {
    expect(amountToCategory(250)).toBe(ClaimAmountCategory.EUR_250);
    expect(amountToCategory("400")).toBe(ClaimAmountCategory.EUR_400);
    expect(amountToCategory(600)).toBe(ClaimAmountCategory.EUR_600);
  });
});
