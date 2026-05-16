import {
  addDays,
  addYears,
  differenceInDays,
  isAfter,
  isBefore,
  isEqual,
  min,
} from "date-fns";

import type {
  LimitationData,
  LimitationStatus,
  LimitationStatusHistoryEntry,
} from "@/lib/limitation/limitation.types";

const LIMITATION_YEARS = 1;
const COMPLAINT_ANSWER_DAYS = 30;

export const COMPLAINT_FILED_STATUSES = [
  "complaint_sent",
  "negotiation",
] as const;

export const COMPLAINT_ANSWERED_STATUSES = [
  "negotiation",
  "waiting_payment",
  "paid_closed",
  "rejected",
  "disqualified",
  "court_submitted",
  "court_pending",
  "court_won",
  "court_lost",
  "court_appeal",
] as const;

const CRM_COMPLAINT_FILED_STATUS_ALIASES = [
  ...COMPLAINT_FILED_STATUSES,
  "DEMAND_LETTER_SENT",
  "AWAITING_AIRLINE_RESPONSE",
] as const;

const CRM_COMPLAINT_ANSWERED_STATUS_ALIASES = [
  ...COMPLAINT_ANSWERED_STATUSES,
  "NEGATIVE_RESPONSE",
  "SETTLEMENT",
  "CLOSED_PAID",
  "REJECTED",
  "DISMISSED",
  "COURT_DECISION_PENDING",
  "COURT_STAGE",
  "WON",
] as const;

function isSameOrAfter(date: Date, compareDate: Date) {
  return isAfter(date, compareDate) || isEqual(date, compareDate);
}

function getHistoryStatus(entry: LimitationStatusHistoryEntry) {
  return "status" in entry ? entry.status : entry.newStatus;
}

export function computeLimitation(
  flightDate: Date,
  complaintFiledAt: Date | null,
  complaintAnsweredAt: Date | null,
  today: Date = new Date(),
): LimitationData {
  const baseExpiryDate = addYears(flightDate, LIMITATION_YEARS);

  let suspensionStartDate: Date | null = null;
  let suspensionEndDate: Date | null = null;
  let suspensionDays = 0;

  if (complaintFiledAt) {
    suspensionStartDate = complaintFiledAt;

    const autoEndDate = addDays(complaintFiledAt, COMPLAINT_ANSWER_DAYS);
    suspensionEndDate = complaintAnsweredAt
      ? min([complaintAnsweredAt, autoEndDate])
      : autoEndDate;

    if (isSameOrAfter(today, suspensionEndDate)) {
      suspensionDays = Math.max(
        0,
        differenceInDays(suspensionEndDate, suspensionStartDate),
      );
    } else if (isAfter(today, suspensionStartDate)) {
      suspensionDays = differenceInDays(today, suspensionStartDate);
    }
  }

  const finalExpiryDate = addDays(baseExpiryDate, suspensionDays);
  const isSuspendedNow = Boolean(
    suspensionStartDate &&
      suspensionEndDate &&
      isSameOrAfter(today, suspensionStartDate) &&
      isBefore(today, suspensionEndDate),
  );
  const suspensionEndsAt = isSuspendedNow ? suspensionEndDate : null;
  const daysRemaining = differenceInDays(finalExpiryDate, today);

  let status: LimitationStatus;
  if (daysRemaining < 0) {
    status = "expired";
  } else if (isSuspendedNow) {
    status = "suspended";
  } else if (daysRemaining > 90) {
    status = "safe";
  } else {
    status = "running";
  }

  return {
    flightDate,
    complaintFiledAt,
    complaintAnsweredAt,
    baseExpiryDate,
    suspensionStartDate,
    suspensionEndDate,
    suspensionDays,
    finalExpiryDate,
    daysRemaining,
    status,
    isSuspendedNow,
    suspensionEndsAt,
  };
}

export function extractComplaintDates(
  statusHistory: LimitationStatusHistoryEntry[],
): {
  complaintFiledAt: Date | null;
  complaintAnsweredAt: Date | null;
} {
  const sorted = [...statusHistory].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  let complaintFiledAt: Date | null = null;
  let complaintAnsweredAt: Date | null = null;

  for (const entry of sorted) {
    const status = getHistoryStatus(entry);

    if (
      !complaintFiledAt &&
      (CRM_COMPLAINT_FILED_STATUS_ALIASES as readonly string[]).includes(status)
    ) {
      complaintFiledAt = entry.createdAt;
    } else if (
      complaintFiledAt &&
      !complaintAnsweredAt &&
      (CRM_COMPLAINT_ANSWERED_STATUS_ALIASES as readonly string[]).includes(
        status,
      )
    ) {
      complaintAnsweredAt = entry.createdAt;
    }
  }

  return { complaintFiledAt, complaintAnsweredAt };
}
