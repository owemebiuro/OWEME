"use client";

import { ChartSkeleton, EmptyState, Panel } from "@/components/analytics/Panel";
import type { AnalyticsPipelineResponse } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

const eurFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function PipelineValue({
  data,
  isLoading,
}: {
  data?: AnalyticsPipelineResponse;
  isLoading: boolean;
}) {
  return (
    <Panel
      title="Wartość pipeline"
      subtitle="Aktywne sprawy według etapu"
      className={styles.panelHalf}
    >
      {isLoading ? (
        <ChartSkeleton rows={5} />
      ) : !data?.stages.length ? (
        <EmptyState />
      ) : (
        <>
          <div className={styles.pipeline}>
            {data.stages.map((stage) => (
              <div key={stage.status} className={styles.pipelineRow}>
                <span
                  className={styles.pipelineDot}
                  style={{ background: stage.color }}
                />
                <div className={styles.pipelineMain}>
                  <div className={styles.pipelineName}>{stage.label}</div>
                  <div className={styles.pipelineTrack}>
                    <div className={styles.progressShell}>
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${stage.winProbability}%`,
                          background: stage.color,
                        }}
                      />
                    </div>
                    <span className={styles.pipelineCount}>
                      {stage.count} spraw
                    </span>
                  </div>
                </div>
                <div className={styles.pipelineValue}>
                  {eurFormatter.format(stage.totalEur)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.pipelineSummary}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Łączna wartość</div>
              <div className={styles.summaryValue}>
                {eurFormatter.format(data.summary.totalEur)}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Aktywne sprawy</div>
              <div className={styles.summaryValue}>{data.summary.activeCount}</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Do zamknięcia</div>
              <div className={styles.summaryValue}>
                {eurFormatter.format(data.summary.closingSoonEur)}
              </div>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
