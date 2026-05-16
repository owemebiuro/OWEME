"use client";

import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

import { ChartSkeleton, EmptyState, Panel } from "@/components/analytics/Panel";
import type { DayActivity } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

function getHeatColor(count: number, max: number): string {
  const pct = max ? count / max : 0;

  if (pct === 0) return "rgba(27,111,212,.06)";
  if (pct < 0.2) return "rgba(27,111,212,.15)";
  if (pct < 0.4) return "rgba(27,111,212,.28)";
  if (pct < 0.65) return "rgba(27,111,212,.45)";
  if (pct < 0.85) return "rgba(27,111,212,.65)";

  return "#1b6fd4";
}

function chunkWeeks(data: DayActivity[]) {
  const weeks: DayActivity[][] = [];

  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return weeks;
}

export function ActivityHeatmap({
  data,
  isLoading,
}: {
  data?: DayActivity[];
  isLoading: boolean;
}) {
  const weeks = chunkWeeks(data ?? []);
  const max = Math.max(1, ...(data ?? []).map((day) => day.count));
  const dayLabels = ["Pn", "", "Śr", "", "Pt", "", "N"];
  const legendValues = [0, 1, 2, 4, 7];

  return (
    <Panel
      title="Aktywność"
      subtitle="Statusy, notatki, dokumenty i zadania"
      className={styles.panelHalf}
    >
      {isLoading ? (
        <ChartSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState />
      ) : (
        <div className={styles.heatmap}>
          <div className={styles.heatMonths}>
            {weeks.map((week, index) => {
              const firstDay = week[0];
              const currentMonth = firstDay
                ? format(parseISO(firstDay.date), "LLL", { locale: pl })
                : "";
              const previousWeek = weeks[index - 1];
              const previousMonth = previousWeek?.[0]
                ? format(parseISO(previousWeek[0].date), "LLL", { locale: pl })
                : "";

              return (
                <span key={firstDay?.date ?? index}>
                  {index === 0 || currentMonth !== previousMonth
                    ? currentMonth
                    : ""}
                </span>
              );
            })}
          </div>

          <div className={styles.heatDays}>
            {dayLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className={styles.heatGrid}>
            {weeks.map((week, weekIndex) => (
              <div
                key={week[0]?.date ?? weekIndex}
                className={styles.heatWeek}
              >
                {week.map((day) => {
                  const parsed = parseISO(day.date);

                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={styles.heatCell}
                      style={{ background: getHeatColor(day.count, max) }}
                      title={`${format(parsed, "dd.MM.yyyy")} · ${day.count} zdarzeń`}
                      aria-label={`${format(parsed, "dd.MM.yyyy")}: ${day.count} zdarzeń`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.heatLegend}>
            <span>Mniej</span>
            {legendValues.map((value) => (
              <span
                key={value}
                className={styles.legendSquare}
                style={{ background: getHeatColor(value, Math.max(...legendValues)) }}
              />
            ))}
            <span>Więcej</span>
          </div>
        </div>
      )}
    </Panel>
  );
}
