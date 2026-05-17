import { format } from "date-fns";
import { pl } from "date-fns/locale";

import type {
  LimitationBadgeVariant,
  LimitationStatus,
} from "@/lib/limitation/limitation.types";

export function formatLimitationDate(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: pl });
}

export function formatShortLimitationDate(date: Date): string {
  return format(date, "dd.MM.yyyy", { locale: pl });
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} dni temu`;
  }

  if (days === 0) {
    return "dziś";
  }

  if (days === 1) {
    return "jutro";
  }

  return `za ${days} dni`;
}

export function getLimitationBadgeVariant(
  status: LimitationStatus,
  daysRemaining: number,
): LimitationBadgeVariant {
  if (status === "expired") {
    return "expired";
  }

  if (status === "suspended") {
    return "suspended";
  }

  if (daysRemaining < 15) {
    return "urgent";
  }

  if (daysRemaining <= 60) {
    return "warning";
  }

  return "safe";
}
