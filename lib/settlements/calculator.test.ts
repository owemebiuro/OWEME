import { ClaimStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { calculateSettlement } from "@/lib/settlements/calculator";

describe("calculateSettlement", () => {
  it("uses 25% commission outside court stage", () => {
    const result = calculateSettlement({
      airlineAmountEur: 600,
      eurPlnRate: 4.29,
      caseStatus: ClaimStatus.NEW,
    });

    expect(result.commissionRate).toBe(0.25);
    expect(result.airlineAmountPln).toBeCloseTo(2574);
    expect(result.companySharePln).toBeCloseTo(643.5);
    expect(result.clientSharePln).toBeCloseTo(1930.5);
  });

  it("uses 45% commission for court stage", () => {
    const result = calculateSettlement({
      airlineAmountEur: 600,
      eurPlnRate: 4.29,
      caseStatus: ClaimStatus.COURT_STAGE,
    });

    expect(result.commissionRate).toBe(0.45);
    expect(result.companySharePln).toBeCloseTo(1158.3);
    expect(result.clientSharePln).toBeCloseTo(1415.7);
  });
});
