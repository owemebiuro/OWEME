"use client";

import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, GlassTooltip } from "@/components/analytics/ChartDefaults";
import { ChartSkeleton, EmptyState, Panel } from "@/components/analytics/Panel";
import type { MonthlyCases } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

function monthLabel(month: string) {
  return format(parseISO(`${month}-01`), "LLL", { locale: pl });
}

function MonthTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  const value = payload?.value ?? "";
  const currentMonth = format(new Date(), "yyyy-MM");
  const isCurrent = value === currentMonth;

  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fill={isCurrent ? CHART_COLORS.ember : CHART_COLORS.axis}
      fontSize={11}
      fontWeight={isCurrent ? 850 : 700}
    >
      {value ? monthLabel(value) : ""}
    </text>
  );
}

export function MonthlyCasesBar({
  data,
  isLoading,
}: {
  data?: MonthlyCases[];
  isLoading: boolean;
}) {
  const currentMonth = format(new Date(), "yyyy-MM");
  const average =
    data && data.length
      ? data.reduce((sum, row) => sum + row.extrajudicial + row.judicial, 0) /
        data.length
      : 0;

  return (
    <Panel
      title="Sprawy miesięcznie"
      subtitle="Pozasądowe i sądowe"
      className={styles.panelBar}
    >
      {isLoading ? (
        <ChartSkeleton />
      ) : !data?.length ? (
        <EmptyState />
      ) : (
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeWidth={0.5} vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={<MonthTick />}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip content={<GlassTooltip />} />
              <ReferenceLine
                y={average}
                stroke="rgba(13,17,23,.32)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Bar dataKey="extrajudicial" name="Pozasądowe" stackId="a" radius={[0, 0, 4, 4]}>
                {data.map((row) => (
                  <Cell
                    key={`extra-${row.month}`}
                    fill={row.month === currentMonth ? CHART_COLORS["ember"] : CHART_COLORS.ember}
                    className={row.month === currentMonth ? styles.currentBar : undefined}
                  />
                ))}
              </Bar>
              <Bar dataKey="judicial" name="Sądowe" stackId="a" radius={[4, 4, 0, 0]}>
                {data.map((row) => (
                  <Cell
                    key={`judicial-${row.month}`}
                    fill={row.month === currentMonth ? CHART_COLORS.ember : CHART_COLORS.emlo}
                    className={row.month === currentMonth ? styles.currentBar : undefined}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
