"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  AnalyticsFunnelResponse,
  AnalyticsKpisResponse,
  AnalyticsPipelineResponse,
  AnalyticsQueryRange,
  AnalyticsRevenueResponse,
  DayActivity,
  EmployeeStats,
  MonthlyCases,
  Period,
  StatusBreakdown,
} from "@/lib/analytics/types";

const staleTime = 5 * 60 * 1000;

type AnalyticsParams = Record<string, string | number | undefined>;

function hasCustomRange(period: Period, range?: AnalyticsQueryRange) {
  return period !== "custom" || Boolean(range?.from && range.to);
}

function analyticsUrl(path: string, params: AnalyticsParams = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();

  return `/api/analytics/${path}${query ? `?${query}` : ""}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error ?? "Nie udało się pobrać danych analityki.");
  }

  return (await response.json()) as T;
}

function rangeParams(period: Period, range?: AnalyticsQueryRange) {
  return {
    period,
    from: period === "custom" ? range?.from : undefined,
    to: period === "custom" ? range?.to : undefined,
  };
}

export function useAnalyticsKpis(
  period: Period,
  range?: AnalyticsQueryRange,
) {
  return useQuery({
    queryKey: ["analytics", "kpis", period, range],
    queryFn: () =>
      fetchJson<AnalyticsKpisResponse>(
        analyticsUrl("kpis", rangeParams(period, range)),
      ),
    enabled: hasCustomRange(period, range),
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export function useAnalyticsRevenue(
  period: Period,
  range?: AnalyticsQueryRange,
) {
  return useQuery({
    queryKey: ["analytics", "revenue", period, range],
    queryFn: () =>
      fetchJson<AnalyticsRevenueResponse>(
        analyticsUrl("revenue", {
          ...rangeParams(period, range),
          groupBy: "month",
        }),
      ),
    enabled: hasCustomRange(period, range),
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export function useStatusBreakdown(
  period: Period,
  range?: AnalyticsQueryRange,
) {
  return useQuery({
    queryKey: ["analytics", "status-breakdown", period, range],
    queryFn: () =>
      fetchJson<StatusBreakdown[]>(
        analyticsUrl("status-breakdown", rangeParams(period, range)),
      ),
    enabled: hasCustomRange(period, range),
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export function useMonthlyCases() {
  return useQuery({
    queryKey: ["analytics", "monthly-cases", "6m"],
    queryFn: () =>
      fetchJson<MonthlyCases[]>(
        analyticsUrl("monthly-cases", { period: "6m" }),
      ),
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export function useConversionFunnel(
  period: Period,
  range?: AnalyticsQueryRange,
) {
  return useQuery({
    queryKey: ["analytics", "funnel", period, range],
    queryFn: () =>
      fetchJson<AnalyticsFunnelResponse>(
        analyticsUrl("funnel", rangeParams(period, range)),
      ),
    enabled: hasCustomRange(period, range),
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export function useTopEmployees(
  period: Period,
  limit = 5,
  range?: AnalyticsQueryRange,
) {
  return useQuery({
    queryKey: ["analytics", "employees", period, limit, range],
    queryFn: () =>
      fetchJson<EmployeeStats[]>(
        analyticsUrl("employees", {
          ...rangeParams(period, range),
          limit,
        }),
      ),
    enabled: hasCustomRange(period, range),
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export function usePipelineValue() {
  return useQuery({
    queryKey: ["analytics", "pipeline", "active"],
    queryFn: () => fetchJson<AnalyticsPipelineResponse>(analyticsUrl("pipeline")),
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export function useActivityHeatmap(weeks = 12) {
  return useQuery({
    queryKey: ["analytics", "activity", weeks],
    queryFn: () =>
      fetchJson<DayActivity[]>(analyticsUrl("activity", { weeks })),
    staleTime,
    refetchOnWindowFocus: false,
  });
}
