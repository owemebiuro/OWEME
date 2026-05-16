import type { ClaimStatus } from "@prisma/client";

import { getCommissionRate } from "@/lib/constants/fees";

export type SettlementCalculatorInput = {
  airlineAmountEur: number;
  eurPlnRate: number;
  caseStatus: ClaimStatus;
};

export type SettlementCalculatorResult = {
  airlineAmountEur: number;
  eurPlnRate: number;
  airlineAmountPln: number;
  commissionRate: number;
  companySharePln: number;
  clientSharePln: number;
};

export function calculateSettlement(
  input: SettlementCalculatorInput,
): SettlementCalculatorResult {
  const commissionRate = getCommissionRate(input.caseStatus);
  const airlineAmountPln = input.airlineAmountEur * input.eurPlnRate;

  return {
    airlineAmountEur: input.airlineAmountEur,
    eurPlnRate: input.eurPlnRate,
    airlineAmountPln,
    commissionRate,
    companySharePln: airlineAmountPln * commissionRate,
    clientSharePln: airlineAmountPln * (1 - commissionRate),
  };
}
