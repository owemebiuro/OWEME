"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { GlassTooltip } from "@/components/analytics/ChartDefaults";
import { ChartSkeleton, EmptyState, Panel } from "@/components/analytics/Panel";
import type { StatusBreakdown } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

export function StatusDonut({
  data,
  isLoading,
}: {
  data?: StatusBreakdown[];
  isLoading: boolean;
}) {
  const total = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <Panel
      title="Statusy spraw"
      subtitle="Struktura spraw w okresie"
      className={styles.panelDonut}
    >
      {isLoading ? (
        <ChartSkeleton rows={4} />
      ) : !data?.length || total === 0 ? (
        <EmptyState />
      ) : (
        <div className={styles.donutWrap}>
          <div className={styles.donutChart}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={52}
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <GlassTooltip
                      valueFormatter={(value) =>
                        typeof value === "number"
                          ? `${value} spraw`
                          : String(value)
                      }
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenter}>
              <span className={styles.donutTotal}>{total}</span>
              <span className={styles.donutCaption}>spraw</span>
            </div>
          </div>

          <div className={styles.legend}>
            {data.map((entry) => (
              <div key={entry.status} className={styles.legendRow}>
                <span
                  className={styles.legendDot}
                  style={{ background: entry.color }}
                />
                <span className={styles.legendLabel}>{entry.label}</span>
                <span className={styles.legendValue}>
                  {entry.count} · {entry.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
