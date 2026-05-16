"use client";

import { ChartSkeleton, EmptyState, Panel } from "@/components/analytics/Panel";
import type { EmployeeStats } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

export function TopEmployees({
  data,
  isLoading,
}: {
  data?: EmployeeStats[];
  isLoading: boolean;
}) {
  const maxClosed = Math.max(1, ...(data ?? []).map((row) => row.closed));

  return (
    <Panel
      title="Top pracownicy"
      subtitle="Zamknięte sprawy i win rate"
      className={styles.panelEmployees}
    >
      {isLoading ? (
        <ChartSkeleton rows={5} />
      ) : !data?.length ? (
        <EmptyState />
      ) : (
        <div className={styles.ranking}>
          {data.map((employee) => (
            <div key={employee.userId} className={styles.rankingRow}>
              <span
                className={styles.avatar}
                style={{ background: employee.avatarColor }}
              >
                {employee.initials}
              </span>
              <div className={styles.employeeMain}>
                <div className={styles.employeeName}>{employee.name}</div>
                <div className={styles.employeeMeta}>
                  {employee.closed} spraw · {employee.winRate.toFixed(0)}% wygr.
                </div>
                <div className={styles.progressShell}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: `${(employee.closed / maxClosed) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className={styles.rankingNumber}>{employee.closed}</div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
