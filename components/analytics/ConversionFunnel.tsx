"use client";

import { ChartSkeleton, EmptyState, Panel } from "@/components/analytics/Panel";
import type { AnalyticsFunnelResponse } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

function formatDays(value: number) {
  return value ? `${value.toFixed(1)} dni` : "Brak danych";
}

export function ConversionFunnel({
  data,
  isLoading,
}: {
  data?: AnalyticsFunnelResponse;
  isLoading: boolean;
}) {
  return (
    <Panel
      title="Lejek konwersji"
      subtitle="Od wniosku do wypłaty"
      className={styles.panelFunnel}
    >
      {isLoading ? (
        <ChartSkeleton rows={2} />
      ) : !data?.steps.length ? (
        <EmptyState />
      ) : (
        <>
          <div className={styles.funnel}>
            {data.steps.map((step, index) => {
              const isLast = index === data.steps.length - 1;
              const opacity = Math.min(1, 0.15 + index * 0.16);
              const background = isLast
                ? "var(--sage)"
                : `rgba(27, 111, 212, ${opacity})`;

              return (
                <div key={step.label} className={styles.funnelStep}>
                  <div className={styles.funnelBarShell}>
                    <div
                      className={styles.funnelBar}
                      style={{
                        width: `${Math.max(step.pct, 8)}%`,
                        background,
                        color: index < 2 ? "var(--lbl)" : "#fff",
                      }}
                      title={`${step.label}: ${step.count} (${step.pct.toFixed(0)}%)`}
                    >
                      <span>{step.label}</span>
                    </div>
                  </div>
                  <div className={styles.funnelCount}>{step.count}</div>
                </div>
              );
            })}
          </div>

          <div className={styles.miniStats}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Skuteczność ogólna</div>
              <div className={styles.summaryValue}>
                {data.stats.successRate.toFixed(1)}%
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Śr. czas rozliczenia</div>
              <div className={styles.summaryValue}>
                {formatDays(data.stats.avgSettlementDays)}
              </div>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
