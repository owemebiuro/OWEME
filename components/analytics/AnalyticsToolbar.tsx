"use client";

import type { AnalyticsQueryRange, Period } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

export interface AnalyticsToolbarProps {
  period: Period;
  range: AnalyticsQueryRange;
  onPeriodChange: (period: Period) => void;
  onRangeChange: (range: AnalyticsQueryRange) => void;
  onExport: () => void;
}

const periods: Array<{ value: Period; label: string }> = [
  { value: "7d", label: "7 dni" },
  { value: "30d", label: "30 dni" },
  { value: "3m", label: "3 mies." },
  { value: "1y", label: "Rok" },
  { value: "custom", label: "Własny" },
];

function ExportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
    </svg>
  );
}

export function AnalyticsToolbar({
  period,
  range,
  onPeriodChange,
  onRangeChange,
  onExport,
}: AnalyticsToolbarProps) {
  return (
    <header className={`${styles.toolbar} toolbar`}>
      <div className={styles.toolbarTitle}>
        <p className={styles.eyebrow}>OWEME CRM</p>
        <h1 className={styles.heading}>Analityka</h1>
      </div>

      <div className={styles.toolbarControls}>
        <div className={styles.segment} role="tablist" aria-label="Okres">
          {periods.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={period === item.value}
              className={`${styles.periodButton} ${
                period === item.value ? styles.periodButtonActive : ""
              }`}
              onClick={() => onPeriodChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {period === "custom" ? (
          <div className={styles.customDates}>
            <input
              type="date"
              value={range.from ?? ""}
              onChange={(event) =>
                onRangeChange({ ...range, from: event.target.value })
              }
              className={styles.dateInput}
              aria-label="Data od"
            />
            <input
              type="date"
              value={range.to ?? ""}
              onChange={(event) =>
                onRangeChange({ ...range, to: event.target.value })
              }
              className={styles.dateInput}
              aria-label="Data do"
            />
          </div>
        ) : null}

        <button type="button" className={styles.exportButton} onClick={onExport}>
          <ExportIcon />
          <span>Eksportuj PDF</span>
        </button>
      </div>
    </header>
  );
}
