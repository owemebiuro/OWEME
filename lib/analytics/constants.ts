import { ClaimStatus } from "@prisma/client";

import type { StatusChartKey } from "@/lib/analytics/types";

export const WON_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.WON,
  ClaimStatus.SETTLEMENT,
  ClaimStatus.CLOSED_PAID,
];

export const LOST_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.REJECTED,
  ClaimStatus.DISMISSED,
];

export const CLOSED_STATUSES: readonly ClaimStatus[] = [
  ...WON_STATUSES,
  ...LOST_STATUSES,
];

export const JUDICIAL_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.COURT_DECISION_PENDING,
  ClaimStatus.COURT_STAGE,
];

export const ACTIVE_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.NEW,
  ClaimStatus.AWAITING_VERIFICATION,
  ClaimStatus.MISSING_DATA,
  ClaimStatus.QUALIFIED,
  ClaimStatus.DOCUMENTS_GENERATED,
  ClaimStatus.ASSIGNMENT_SIGNED,
  ClaimStatus.DEMAND_LETTER_PREPARED,
  ClaimStatus.DEMAND_LETTER_SENT,
  ClaimStatus.AWAITING_AIRLINE_RESPONSE,
  ClaimStatus.NEGATIVE_RESPONSE,
  ClaimStatus.COURT_DECISION_PENDING,
  ClaimStatus.COURT_STAGE,
];

export const STATUS_CHART_COLORS: Record<StatusChartKey, string> = {
  new: "#1b6fd4",
  in_progress: "#2a82e8",
  judicial: "#1259a8",
  closed_won: "#1e8a6e",
  closed_lost: "#d4def0",
};

export const STATUS_BREAKDOWN_GROUPS: Array<{
  status: StatusChartKey;
  label: string;
  statuses: readonly ClaimStatus[];
}> = [
  {
    status: "new",
    label: "Nowe",
    statuses: [
      ClaimStatus.NEW,
      ClaimStatus.AWAITING_VERIFICATION,
      ClaimStatus.MISSING_DATA,
    ],
  },
  {
    status: "in_progress",
    label: "W toku",
    statuses: [
      ClaimStatus.QUALIFIED,
      ClaimStatus.DOCUMENTS_GENERATED,
      ClaimStatus.ASSIGNMENT_SIGNED,
      ClaimStatus.DEMAND_LETTER_PREPARED,
      ClaimStatus.DEMAND_LETTER_SENT,
      ClaimStatus.AWAITING_AIRLINE_RESPONSE,
      ClaimStatus.NEGATIVE_RESPONSE,
    ],
  },
  {
    status: "judicial",
    label: "Sądowe",
    statuses: JUDICIAL_STATUSES,
  },
  {
    status: "closed_won",
    label: "Wygrane",
    statuses: WON_STATUSES,
  },
  {
    status: "closed_lost",
    label: "Przegrane",
    statuses: LOST_STATUSES,
  },
];

export const PIPELINE_STAGE_COLORS: Record<ClaimStatus, string> = {
  NEW: "#1b6fd4",
  AWAITING_VERIFICATION: "#2a82e8",
  MISSING_DATA: "#2a82e8",
  QUALIFIED: "#1b6fd4",
  DOCUMENTS_GENERATED: "#1b6fd4",
  ASSIGNMENT_SIGNED: "#1b6fd4",
  DEMAND_LETTER_PREPARED: "#1259a8",
  DEMAND_LETTER_SENT: "#1259a8",
  AWAITING_AIRLINE_RESPONSE: "#1259a8",
  NEGATIVE_RESPONSE: "#1259a8",
  COURT_DECISION_PENDING: "#1e8a6e",
  COURT_STAGE: "#1e8a6e",
  WON: "#1e8a6e",
  SETTLEMENT: "#1e8a6e",
  CLOSED_PAID: "#1e8a6e",
  REJECTED: "#d4def0",
  DISMISSED: "#d4def0",
};

export const PIPELINE_WIN_PROBABILITY: Record<ClaimStatus, number> = {
  NEW: 10,
  AWAITING_VERIFICATION: 18,
  MISSING_DATA: 12,
  QUALIFIED: 36,
  DOCUMENTS_GENERATED: 44,
  ASSIGNMENT_SIGNED: 52,
  DEMAND_LETTER_PREPARED: 58,
  DEMAND_LETTER_SENT: 64,
  AWAITING_AIRLINE_RESPONSE: 68,
  NEGATIVE_RESPONSE: 46,
  COURT_DECISION_PENDING: 72,
  COURT_STAGE: 78,
  WON: 100,
  SETTLEMENT: 95,
  CLOSED_PAID: 100,
  REJECTED: 0,
  DISMISSED: 0,
};
