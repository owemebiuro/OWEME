import { ClaimStatus } from "@prisma/client";

export type CaseView = "all" | "extrajudicial" | "judicial";

export const JUDICIAL_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.COURT_DECISION_PENDING,
  ClaimStatus.COURT_STAGE,
  ClaimStatus.WON,
  ClaimStatus.DISMISSED,
] as const;

export function isJudicialStatus(status: ClaimStatus) {
  return JUDICIAL_STATUSES.includes(status);
}

export function isJudicialView(view: CaseView | undefined) {
  return view === "judicial";
}
