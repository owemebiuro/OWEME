"use client";

import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, GlassTooltip } from "@/components/analytics/ChartDefaults";
import { ChartSkeleton, EmptyState, Panel } from "@/components/analytics/Panel";
import type { AnalyticsRevenueResponse } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

function monthLabel(month: string) {
  return format(parseISO(`${month}-01`), "LLL", { locale: pl });
}

function percentLabel(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function RevenueChart({
  data,
  isLoading,
}: {
  data?: AnalyticsRevenueResponse;
  isLoading: boolean;
}) {
  return (
    <Panel
      title="Przychód"
      subtitle="Przychód OWEME i cel miesięczny"
      className={styles.panelRevenue}
    >
      {isLoading ? (
        <ChartSkeleton />
      ) : !data?.data.length ? (
        <EmptyState />
      ) : (
        <>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.data}
                margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.ember} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={CHART_COLORS.ember} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeWidth={0.5} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11, fontWeight: 700 }}
                  tickFormatter={monthLabel}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(value) => `${Number(value) / 1000}k`}
                />
                <Tooltip
                  content={
                    <GlassTooltip
                      valueFormatter={(value) =>
                        typeof value === "number" ? currencyFormatter.format(value) : value
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Przychód"
                  fill="url(#revenueFill)"
                  stroke={CHART_COLORS.ember}
                  strokeWidth={2}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Cel"
                  stroke={CHART_COLORS.sage}
                  strokeDasharray="6 4"
                  strokeOpacity={0.4}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Łącznie za okres</div>
              <div className={styles.summaryValue}>
                {currencyFormatter.format(data.summary.total)}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Zmiana vs poprzedni</div>
              <div className={styles.summaryValue}>
                {percentLabel(data.summary.changePct)}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Rekord miesięczny</div>
              <div className={styles.summaryValue}>
                {currencyFormatter.format(data.summary.record)}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Średnia / miesiąc</div>
              <div className={styles.summaryValue}>
                {currencyFormatter.format(data.summary.average)}
              </div>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
