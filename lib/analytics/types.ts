import type { ClaimStatus } from "@prisma/client";

export type Period = "7d" | "30d" | "3m" | "1y" | "custom";
export type AnalyticsPeriodParam = Period | "6m" | "active";

export type AnalyticsQueryRange = {
  from?: string;
  to?: string;
};

export type DeltaDirection = "up" | "down" | "neutral";

export type KpiDatum = {
  key:
    | "revenue"
    | "wonCases"
    | "newCases"
    | "avgCaseValue"
    | "avgClosureDays";
  label: string;
  value: number;
  format: "currencyPLN" | "number" | "days";
  delta?: {
    value: string;
    direction: DeltaDirection;
  };
  accent?: "ember" | "sage" | "default";
};

export type AnalyticsKpisResponse = {
  items: KpiDatum[];
};

export type RevenueDataPoint = {
  month: string;
  revenue: number;
  target: number;
  caseCount: number;
};

export type RevenueSummary = {
  total: number;
  changePct: number;
  record: number;
  average: number;
};

export type AnalyticsRevenueResponse = {
  data: RevenueDataPoint[];
  summary: RevenueSummary;
};

export type StatusChartKey =
  | "new"
  | "in_progress"
  | "judicial"
  | "closed_won"
  | "closed_lost";

export type StatusBreakdown = {
  status: StatusChartKey;
  label: string;
  count: number;
  pct: number;
  color: string;
};

export type MonthlyCases = {
  month: string;
  extrajudicial: number;
  judicial: number;
};

export type FunnelStep = {
  label: string;
  count: number;
  pct: number;
};

export type FunnelStats = {
  successRate: number;
  avgSettlementDays: number;
};

export type AnalyticsFunnelResponse = {
  steps: FunnelStep[];
  stats: FunnelStats;
};

export type EmployeeStats = {
  userId: string;
  initials: string;
  name: string;
  closed: number;
  winRate: number;
  avatarColor: string;
};

export type PipelineStage = {
  status: ClaimStatus;
  label: string;
  color: string;
  count: number;
  totalEur: number;
  winProbability: number;
};

export type PipelineSummary = {
  totalEur: number;
  activeCount: number;
  closingSoonEur: number;
};

export type AnalyticsPipelineResponse = {
  stages: PipelineStage[];
  summary: PipelineSummary;
};

export type DayActivity = {
  date: string;
  count: number;
};
