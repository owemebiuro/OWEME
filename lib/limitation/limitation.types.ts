export type LimitationStatus =
  | "running"
  | "suspended"
  | "expired"
  | "safe";

export type LimitationBadgeVariant =
  | "expired"
  | "urgent"
  | "warning"
  | "suspended"
  | "safe";

export interface LimitationData {
  flightDate: Date;
  complaintFiledAt: Date | null;
  complaintAnsweredAt: Date | null;
  baseExpiryDate: Date;
  suspensionStartDate: Date | null;
  suspensionEndDate: Date | null;
  suspensionDays: number;
  finalExpiryDate: Date;
  daysRemaining: number;
  status: LimitationStatus;
  isSuspendedNow: boolean;
  suspensionEndsAt: Date | null;
}

export type LimitationStatusHistoryEntry = {
  createdAt: Date;
} & (
  | {
      status: string;
    }
  | {
      newStatus: string;
    }
);
