import type { Period } from "@/lib/analytics/types";

const PERIODS: readonly Period[] = ["7d", "30d", "3m", "1y", "custom"];

export function readPeriod(searchParams: URLSearchParams): Period {
  const value = searchParams.get("period");

  return PERIODS.includes(value as Period) ? (value as Period) : "30d";
}

export function readRange(searchParams: URLSearchParams) {
  return {
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  };
}

export function readGroupBy(searchParams: URLSearchParams) {
  return searchParams.get("groupBy") === "week" ? "week" : "month";
}

export function readLimit(searchParams: URLSearchParams, fallback: number) {
  const value = Number(searchParams.get("limit") ?? fallback);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(value), 1), 25);
}

export function readWeeks(searchParams: URLSearchParams, fallback: number) {
  const value = Number(searchParams.get("weeks") ?? fallback);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(value), 1), 26);
}
