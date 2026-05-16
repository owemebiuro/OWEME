import {
  ClaimStatus,
  CommissionModel,
  SettlementStatus,
  type Prisma,
} from "@prisma/client";
import {
  differenceInMilliseconds,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { pl } from "date-fns/locale";

import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  JUDICIAL_STATUSES,
  LOST_STATUSES,
  PIPELINE_STAGE_COLORS,
  PIPELINE_WIN_PROBABILITY,
  STATUS_BREAKDOWN_GROUPS,
  STATUS_CHART_COLORS,
  WON_STATUSES,
} from "@/lib/analytics/constants";
import {
  getDateRange,
  getPreviousDateRange,
  type AnalyticsDateRange,
} from "@/lib/analytics/dateRange";
import type {
  AnalyticsFunnelResponse,
  AnalyticsKpisResponse,
  AnalyticsPipelineResponse,
  AnalyticsRevenueResponse,
  DayActivity,
  EmployeeStats,
  FunnelStep,
  MonthlyCases,
  Period,
  PipelineStage,
  RevenueDataPoint,
  StatusBreakdown,
} from "@/lib/analytics/types";
import { claimStatusLabels } from "@/lib/claims/status-colors";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

type GroupBy = "month" | "week";

function decimalToNumber(
  value: Prisma.Decimal | number | string | null | undefined,
) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
}

function average(values: readonly number[]) {
  const usable = values.filter((value) => Number.isFinite(value));

  if (!usable.length) {
    return 0;
  }

  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function percentageDelta(current: number, previous: number) {
  if (previous === 0 && current === 0) {
    return 0;
  }

  if (previous === 0) {
    return 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatDelta(current: number, previous: number) {
  const change = percentageDelta(current, previous);
  const direction =
    Math.abs(change) < 0.05 ? "neutral" : change > 0 ? "up" : "down";

  return {
    value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
    direction,
  } as const;
}

function payoutCompanyShare(payout: {
  companyShare: Prisma.Decimal | null;
  owemeFee: Prisma.Decimal;
}) {
  const companyShare = decimalToNumber(payout.companyShare);

  return companyShare > 0 ? companyShare : decimalToNumber(payout.owemeFee);
}

function payoutAirlineAmount(payout: {
  airlinePaymentAmount: Prisma.Decimal | null;
  amountRecovered: Prisma.Decimal;
}) {
  const airlinePayment = decimalToNumber(payout.airlinePaymentAmount);

  return airlinePayment > 0
    ? airlinePayment
    : decimalToNumber(payout.amountRecovered);
}

function commissionRate(model: CommissionModel | null | undefined) {
  return model === CommissionModel.COURT_40 ? 0.4 : 0.3;
}

async function getKpiSnapshot(range: AnalyticsDateRange) {
  const [payouts, wonCases, newCases, closedClaims] = await Promise.all([
    prisma.payout.findMany({
      where: {
        receivedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        amountRecovered: true,
        airlinePaymentAmount: true,
        companyShare: true,
        owemeFee: true,
        commissionModel: true,
        claim: {
          select: {
            commissionModel: true,
          },
        },
      },
    }),
    prisma.claim.count({
      where: {
        deletedAt: null,
        status: { in: [...WON_STATUSES] },
        OR: [
          {
            closedAt: {
              gte: range.start,
              lte: range.end,
            },
          },
          {
            closedAt: null,
            updatedAt: {
              gte: range.start,
              lte: range.end,
            },
          },
        ],
      },
    }),
    prisma.claim.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    prisma.claim.findMany({
      where: {
        deletedAt: null,
        status: { in: [...CLOSED_STATUSES] },
        closedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    }),
  ]);

  const revenue = payouts.reduce(
    (sum, payout) => sum + payoutCompanyShare(payout),
    0,
  );
  const avgAirlinePayment = average(payouts.map(payoutAirlineAmount));
  const avgCommissionRate = average(
    payouts.map((payout) =>
      commissionRate(payout.claim?.commissionModel ?? payout.commissionModel),
    ),
  );
  const avgCaseValue = avgAirlinePayment * avgCommissionRate;
  const avgClosureDays = average(
    closedClaims
      .filter((claim) => claim.closedAt)
      .map((claim) =>
        claim.closedAt
          ? differenceInMilliseconds(claim.closedAt, claim.createdAt) / DAY_MS
          : 0,
      ),
  );

  return {
    revenue,
    wonCases,
    newCases,
    avgCaseValue,
    avgClosureDays,
  };
}

export async function getAnalyticsKpis(
  period: Period,
  from?: string | null,
  to?: string | null,
): Promise<AnalyticsKpisResponse> {
  const range = getDateRange(period, from, to);
  const previousRange = getPreviousDateRange(range);
  const [current, previous] = await Promise.all([
    getKpiSnapshot(range),
    getKpiSnapshot(previousRange),
  ]);

  return {
    items: [
      {
        key: "revenue",
        label: "Przychód",
        value: current.revenue,
        format: "currencyPLN",
        delta: formatDelta(current.revenue, previous.revenue),
        accent: "ember",
      },
      {
        key: "wonCases",
        label: "Spraw wygranych",
        value: current.wonCases,
        format: "number",
        delta: formatDelta(current.wonCases, previous.wonCases),
        accent: "sage",
      },
      {
        key: "newCases",
        label: "Nowych spraw",
        value: current.newCases,
        format: "number",
        delta: formatDelta(current.newCases, previous.newCases),
      },
      {
        key: "avgCaseValue",
        label: "Śr. wartość sprawy",
        value: current.avgCaseValue,
        format: "currencyPLN",
        delta: formatDelta(current.avgCaseValue, previous.avgCaseValue),
        accent: "ember",
      },
      {
        key: "avgClosureDays",
        label: "Śr. czas zamknięcia",
        value: current.avgClosureDays,
        format: "days",
        delta: formatDelta(current.avgClosureDays, previous.avgClosureDays),
      },
    ],
  };
}

function buildBuckets(range: AnalyticsDateRange, groupBy: GroupBy) {
  if (groupBy === "week") {
    return eachWeekOfInterval(
      {
        start: range.start,
        end: range.end,
      },
      { weekStartsOn: 1 },
    ).map((weekStart) => ({
      key: format(weekStart, "yyyy-MM-dd"),
      start: startOfWeek(weekStart, { weekStartsOn: 1 }),
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
    }));
  }

  return eachMonthOfInterval({
    start: startOfMonth(range.start),
    end: range.end,
  }).map((monthStart) => ({
    key: format(monthStart, "yyyy-MM"),
    start: startOfMonth(monthStart),
    end: endOfMonth(monthStart),
  }));
}

async function getRevenueTotal(range: AnalyticsDateRange) {
  const payouts = await prisma.payout.findMany({
    where: {
      receivedAt: {
        gte: range.start,
        lte: range.end,
      },
    },
    select: {
      companyShare: true,
      owemeFee: true,
    },
  });

  return payouts.reduce((sum, payout) => sum + payoutCompanyShare(payout), 0);
}

export async function getAnalyticsRevenue(
  period: Period,
  groupBy: GroupBy,
  from?: string | null,
  to?: string | null,
): Promise<AnalyticsRevenueResponse> {
  const range = getDateRange(period, from, to);
  const previousRange = getPreviousDateRange(range);
  const buckets = buildBuckets(range, groupBy);
  const [payouts, previousTotal] = await Promise.all([
    prisma.payout.findMany({
      where: {
        receivedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        claimId: true,
        receivedAt: true,
        companyShare: true,
        owemeFee: true,
      },
    }),
    getRevenueTotal(previousRange),
  ]);
  const currentTotal = payouts.reduce(
    (sum, payout) => sum + payoutCompanyShare(payout),
    0,
  );
  const targetBase =
    previousTotal > 0
      ? previousTotal / Math.max(buckets.length, 1)
      : currentTotal / Math.max(buckets.length, 1);

  const data: RevenueDataPoint[] = buckets.map((bucket) => {
    const inBucket = payouts.filter((payout) =>
      isWithinInterval(payout.receivedAt, {
        start: bucket.start < range.start ? range.start : bucket.start,
        end: bucket.end > range.end ? range.end : bucket.end,
      }),
    );
    const caseIds = new Set(inBucket.map((payout) => payout.claimId));

    return {
      month: bucket.key,
      revenue: inBucket.reduce(
        (sum, payout) => sum + payoutCompanyShare(payout),
        0,
      ),
      target: Math.round(targetBase),
      caseCount: caseIds.size,
    };
  });

  return {
    data,
    summary: {
      total: currentTotal,
      changePct: percentageDelta(currentTotal, previousTotal),
      record: Math.max(0, ...data.map((point) => point.revenue)),
      average: currentTotal / Math.max(data.length, 1),
    },
  };
}

export async function getStatusBreakdown(
  period: Period,
  from?: string | null,
  to?: string | null,
): Promise<StatusBreakdown[]> {
  const range = getDateRange(period, from, to);
  const claims = await prisma.claim.findMany({
    where: {
      deletedAt: null,
      createdAt: {
        gte: range.start,
        lte: range.end,
      },
    },
    select: {
      status: true,
    },
  });
  const total = claims.length;

  return STATUS_BREAKDOWN_GROUPS.map((group) => {
    const count = claims.filter((claim) =>
      group.statuses.includes(claim.status),
    ).length;

    return {
      status: group.status,
      label: group.label,
      count,
      pct: total ? (count / total) * 100 : 0,
      color: STATUS_CHART_COLORS[group.status],
    };
  });
}

export async function getMonthlyCases(
  period = "6m",
  from?: string | null,
  to?: string | null,
): Promise<MonthlyCases[]> {
  const range = getDateRange(period, from, to);
  const buckets = buildBuckets(range, "month");
  const claims = await prisma.claim.findMany({
    where: {
      deletedAt: null,
      createdAt: {
        gte: range.start,
        lte: range.end,
      },
    },
    select: {
      createdAt: true,
      status: true,
      isCourtStage: true,
    },
  });

  return buckets.map((bucket) => {
    const inBucket = claims.filter((claim) =>
      isWithinInterval(claim.createdAt, {
        start: bucket.start < range.start ? range.start : bucket.start,
        end: bucket.end > range.end ? range.end : bucket.end,
      }),
    );
    const judicial = inBucket.filter(
      (claim) =>
        claim.isCourtStage || JUDICIAL_STATUSES.includes(claim.status),
    ).length;

    return {
      month: bucket.key,
      extrajudicial: inBucket.length - judicial,
      judicial,
    };
  });
}

function hasReachedStatus(
  claim: { status: ClaimStatus; qualifiedAt: Date | null; isCourtStage: boolean },
  statuses: readonly ClaimStatus[],
) {
  return statuses.includes(claim.status);
}

export async function getConversionFunnel(
  period: Period,
  from?: string | null,
  to?: string | null,
): Promise<AnalyticsFunnelResponse> {
  const range = getDateRange(period, from, to);
  const claims = await prisma.claim.findMany({
    where: {
      deletedAt: null,
      createdAt: {
        gte: range.start,
        lte: range.end,
      },
    },
    select: {
      createdAt: true,
      qualifiedAt: true,
      status: true,
      isCourtStage: true,
      payouts: {
        select: {
          status: true,
          receivedAt: true,
          clientPaidAt: true,
        },
      },
    },
  });

  const qualifiedStatuses = [
    ClaimStatus.QUALIFIED,
    ClaimStatus.DOCUMENTS_GENERATED,
    ClaimStatus.ASSIGNMENT_SIGNED,
    ClaimStatus.DEMAND_LETTER_PREPARED,
    ClaimStatus.DEMAND_LETTER_SENT,
    ClaimStatus.AWAITING_AIRLINE_RESPONSE,
    ClaimStatus.NEGATIVE_RESPONSE,
    ClaimStatus.COURT_DECISION_PENDING,
    ClaimStatus.COURT_STAGE,
    ...WON_STATUSES,
    ...LOST_STATUSES,
  ] as const;
  const demandSentStatuses = [
    ClaimStatus.DEMAND_LETTER_SENT,
    ClaimStatus.AWAITING_AIRLINE_RESPONSE,
    ClaimStatus.NEGATIVE_RESPONSE,
    ClaimStatus.COURT_DECISION_PENDING,
    ClaimStatus.COURT_STAGE,
    ...WON_STATUSES,
    ...LOST_STATUSES,
  ] as const;
  const negotiationStatuses = [
    ClaimStatus.AWAITING_AIRLINE_RESPONSE,
    ClaimStatus.NEGATIVE_RESPONSE,
    ClaimStatus.COURT_DECISION_PENDING,
    ClaimStatus.COURT_STAGE,
    ...WON_STATUSES,
    ...LOST_STATUSES,
  ] as const;
  const baseCount = claims.length;
  const paidStatuses = new Set<SettlementStatus>([
    SettlementStatus.RECEIVED,
    SettlementStatus.CLIENT_PAID,
    SettlementStatus.COMPLETED,
  ]);
  const paidClaims = claims.filter(
    (claim) =>
      claim.status === ClaimStatus.CLOSED_PAID ||
      claim.payouts.some((payout) => paidStatuses.has(payout.status)),
  );
  const steps: FunnelStep[] = [
    {
      label: "Złożone wnioski",
      count: baseCount,
      pct: 100,
    },
    {
      label: "Zakwalifikowane",
      count: claims.filter(
        (claim) =>
          Boolean(claim.qualifiedAt) ||
          hasReachedStatus(claim, qualifiedStatuses),
      ).length,
      pct: 0,
    },
    {
      label: "Reklamacja wysłana",
      count: claims.filter((claim) =>
        hasReachedStatus(claim, demandSentStatuses),
      ).length,
      pct: 0,
    },
    {
      label: "Negocjacje",
      count: claims.filter((claim) =>
        hasReachedStatus(claim, negotiationStatuses),
      ).length,
      pct: 0,
    },
    {
      label: "Do sądu",
      count: claims.filter(
        (claim) =>
          claim.isCourtStage || hasReachedStatus(claim, JUDICIAL_STATUSES),
      ).length,
      pct: 0,
    },
    {
      label: "Wypłacone",
      count: paidClaims.length,
      pct: 0,
    },
  ].map((step) => ({
    ...step,
    pct: baseCount ? (step.count / baseCount) * 100 : 0,
  }));
  const settlementDays = paidClaims.flatMap((claim) =>
    claim.payouts
      .filter((payout) => payout.receivedAt)
      .map(
        (payout) =>
          differenceInMilliseconds(payout.receivedAt, claim.createdAt) / DAY_MS,
      ),
  );

  return {
    steps,
    stats: {
      successRate: baseCount ? (paidClaims.length / baseCount) * 100 : 0,
      avgSettlementDays: average(settlementDays),
    },
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function getEmployeeStats(
  period: Period,
  limit: number,
  from?: string | null,
  to?: string | null,
): Promise<EmployeeStats[]> {
  const range = getDateRange(period, from, to);
  const claims = await prisma.claim.findMany({
    where: {
      deletedAt: null,
      ownerId: { not: null },
      status: { in: [...CLOSED_STATUSES] },
      closedAt: {
        gte: range.start,
        lte: range.end,
      },
    },
    select: {
      status: true,
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  const byUser = new Map<
    string,
    { userId: string; name: string; closed: number; won: number }
  >();

  for (const claim of claims) {
    if (!claim.owner) {
      continue;
    }

    const current = byUser.get(claim.owner.id) ?? {
      userId: claim.owner.id,
      name: claim.owner.name,
      closed: 0,
      won: 0,
    };

    current.closed += 1;
    current.won += WON_STATUSES.includes(claim.status) ? 1 : 0;
    byUser.set(claim.owner.id, current);
  }

  const gradients = [
    "linear-gradient(135deg, #1b6fd4, #2a82e8)",
    "linear-gradient(135deg, #1e8a6e, #62b39e)",
    "linear-gradient(135deg, #1259a8, #1b6fd4)",
    "linear-gradient(135deg, #0d1117, #1259a8)",
    "linear-gradient(135deg, #2a82e8, #1e8a6e)",
  ];

  return Array.from(byUser.values())
    .sort((a, b) => b.closed - a.closed)
    .slice(0, limit)
    .map((row, index) => ({
      userId: row.userId,
      initials: initials(row.name),
      name: row.name,
      closed: row.closed,
      winRate: row.closed ? (row.won / row.closed) * 100 : 0,
      avatarColor: gradients[index % gradients.length],
    }));
}

export async function getPipelineValue(): Promise<AnalyticsPipelineResponse> {
  const claims = await prisma.claim.findMany({
    where: {
      deletedAt: null,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: {
      status: true,
      potentialAmount: true,
      estimatedFee: true,
      payouts: {
        select: {
          airlinePaymentAmount: true,
          amountRecovered: true,
        },
      },
    },
  });
  const byStatus = new Map<ClaimStatus, { count: number; totalEur: number }>();

  for (const claim of claims) {
    const payoutValue = claim.payouts.reduce(
      (sum, payout) => sum + payoutAirlineAmount(payout),
      0,
    );
    const claimValue =
      decimalToNumber(claim.potentialAmount) ||
      payoutValue ||
      decimalToNumber(claim.estimatedFee);
    const current = byStatus.get(claim.status) ?? {
      count: 0,
      totalEur: 0,
    };

    current.count += 1;
    current.totalEur += claimValue;
    byStatus.set(claim.status, current);
  }

  const stages: PipelineStage[] = ACTIVE_STATUSES.map((status) => {
    const row = byStatus.get(status) ?? {
      count: 0,
      totalEur: 0,
    };

    return {
      status,
      label: claimStatusLabels[status],
      color: PIPELINE_STAGE_COLORS[status],
      count: row.count,
      totalEur: row.totalEur,
      winProbability: PIPELINE_WIN_PROBABILITY[status],
    };
  }).filter((stage) => stage.count > 0);
  const totalEur = stages.reduce((sum, stage) => sum + stage.totalEur, 0);
  const closingSoonStatuses = new Set<ClaimStatus>([
    ClaimStatus.DEMAND_LETTER_SENT,
    ClaimStatus.AWAITING_AIRLINE_RESPONSE,
    ClaimStatus.COURT_DECISION_PENDING,
    ClaimStatus.COURT_STAGE,
  ]);

  return {
    stages,
    summary: {
      totalEur,
      activeCount: claims.length,
      closingSoonEur: stages
        .filter((stage) => closingSoonStatuses.has(stage.status))
        .reduce((sum, stage) => sum + stage.totalEur, 0),
    },
  };
}

export async function getActivityHeatmap(weeks: number): Promise<DayActivity[]> {
  const safeWeeks = Math.min(Math.max(weeks, 1), 26);
  const endWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const start = startOfDay(subWeeks(endWeek, safeWeeks - 1));
  const end = endOfDay(endOfWeek(endWeek, { weekStartsOn: 1 }));
  const counts = new Map<string, number>();
  const interval = { start, end };

  for (const day of eachDayOfInterval(interval)) {
    counts.set(format(day, "yyyy-MM-dd"), 0);
  }

  function increment(date: Date | null | undefined) {
    if (!date || !isWithinInterval(date, interval)) {
      return;
    }

    const key = format(date, "yyyy-MM-dd");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const [statusHistory, notes, closedClaims, documents, tasks] =
    await Promise.all([
      prisma.claimStatusHistory.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: { createdAt: true },
      }),
      prisma.note.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: { createdAt: true },
      }),
      prisma.claim.findMany({
        where: {
          deletedAt: null,
          closedAt: {
            gte: start,
            lte: end,
          },
        },
        select: { closedAt: true },
      }),
      prisma.document.findMany({
        where: {
          generatedAt: {
            gte: start,
            lte: end,
          },
        },
        select: { generatedAt: true },
      }),
      prisma.task.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: { createdAt: true },
      }),
    ]);

  statusHistory.forEach((event) => increment(event.createdAt));
  notes.forEach((note) => increment(note.createdAt));
  closedClaims.forEach((claim) => increment(claim.closedAt));
  documents.forEach((document) => increment(document.generatedAt));
  tasks.forEach((task) => increment(task.createdAt));

  return Array.from(counts.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

export function formatMonthLabel(month: string) {
  const date = month.includes("-W")
    ? new Date(month)
    : new Date(`${month}-01T00:00:00.000`);

  return format(date, "LLL", { locale: pl });
}
