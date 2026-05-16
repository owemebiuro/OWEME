import type { ClaimStatus } from "@prisma/client";

import { JUDICIAL_STATUSES } from "@/lib/constants/statuses";

export const COMMISSION_RATES = {
  EXTRAJUDICIAL: 0.25,
  JUDICIAL: 0.45,
} as const;

export function getCommissionRate(status: ClaimStatus): number {
  return JUDICIAL_STATUSES.includes(status)
    ? COMMISSION_RATES.JUDICIAL
    : COMMISSION_RATES.EXTRAJUDICIAL;
}
