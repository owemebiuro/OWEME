import {
  endOfDay,
  isValid,
  parseISO,
  startOfDay,
  subDays,
  subMilliseconds,
} from "date-fns";

import type { AnalyticsPeriodParam } from "@/lib/analytics/types";

export type AnalyticsDateRange = {
  start: Date;
  end: Date;
};

const PERIOD_DAYS: Record<Exclude<AnalyticsPeriodParam, "custom" | "active">, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

function parseDateBoundary(value: string | null | undefined, end = false) {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return null;
  }

  return end ? endOfDay(parsed) : startOfDay(parsed);
}

export function getDateRange(
  period: string | null | undefined,
  from?: string | null,
  to?: string | null,
): AnalyticsDateRange {
  const customStart = parseDateBoundary(from);
  const customEnd = parseDateBoundary(to, true);

  if (customStart && customEnd) {
    return {
      start: customStart,
      end: customEnd,
    };
  }

  const now = new Date();
  const normalizedPeriod = period as AnalyticsPeriodParam | null | undefined;
  const days =
    normalizedPeriod && normalizedPeriod in PERIOD_DAYS
      ? PERIOD_DAYS[normalizedPeriod as keyof typeof PERIOD_DAYS]
      : PERIOD_DAYS["30d"];

  return {
    start: startOfDay(subDays(now, days)),
    end: now,
  };
}

export function getPreviousDateRange(range: AnalyticsDateRange) {
  const durationMs = range.end.getTime() - range.start.getTime();

  return {
    start: subMilliseconds(range.start, durationMs),
    end: subMilliseconds(range.end, durationMs),
  };
}
