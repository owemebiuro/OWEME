"use client";

import type { ReactNode } from "react";

import type { KpiDatum } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" | "neutral" };
  accent?: "ember" | "sage" | "default";
  icon: ReactNode;
}

function MetricIcon({ path }: { path: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="h-4 w-4"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const icons: Record<KpiDatum["key"], ReactNode> = {
  revenue: (
    <MetricIcon
      path={
        <>
          <path strokeLinecap="round" d="M12 3v18" />
          <path strokeLinecap="round" d="M17 7.5c-.8-1.1-2.3-1.8-4-1.8-2.4 0-4 .9-4 2.5 0 3.8 8.5 1.7 8.5 6.4 0 1.9-1.8 3-4.5 3-2.1 0-3.8-.8-4.8-2.1" />
        </>
      }
    />
  ),
  wonCases: (
    <MetricIcon
      path={
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4 10-10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" />
        </>
      }
    />
  ),
  newCases: (
    <MetricIcon
      path={
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z" />
        </>
      }
    />
  ),
  avgCaseValue: (
    <MetricIcon
      path={
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 15.5 19 17l2-3" />
        </>
      }
    />
  ),
  avgClosureDays: (
    <MetricIcon
      path={
        <>
          <circle cx="12" cy="12" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
        </>
      }
    />
  ),
};

const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 0,
});

function formatKpiValue(item: KpiDatum) {
  if (item.format === "currencyPLN") {
    return currencyFormatter.format(item.value);
  }

  if (item.format === "days") {
    return item.value ? `${item.value.toFixed(1)} dni` : "Brak danych";
  }

  return numberFormatter.format(item.value);
}

export function KpiCard({
  label,
  value,
  delta,
  accent = "default",
  icon,
}: KpiCardProps) {
  const iconClass =
    accent === "ember"
      ? styles.kpiIconEmber
      : accent === "sage"
        ? styles.kpiIconSage
        : "";
  const deltaClass =
    delta?.direction === "up"
      ? styles.deltaUp
      : delta?.direction === "down"
        ? styles.deltaDown
        : "";

  return (
    <article className={styles.kpiCard}>
      <div className={styles.kpiTop}>
        <p className={styles.kpiLabel}>{label}</p>
        <span className={`${styles.kpiIcon} ${iconClass}`}>{icon}</span>
      </div>
      <div className={styles.kpiValue}>{value}</div>
      {delta ? (
        <div className={`${styles.kpiDelta} ${deltaClass}`}>
          <span>{delta.value}</span>
          <span>vs poprzedni okres</span>
        </div>
      ) : null}
    </article>
  );
}

function KpiSkeleton() {
  return (
    <article className={styles.kpiCard} aria-hidden="true">
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
      <div className={`${styles.skeleton} ${styles.skeletonLine} mt-4 w-24`} />
    </article>
  );
}

export function KpiStrip({
  items,
  isLoading,
}: {
  items?: KpiDatum[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className={styles.kpiStrip} aria-label="Ładowanie KPI">
        {Array.from({ length: 5 }, (_, index) => (
          <KpiSkeleton key={index} />
        ))}
      </section>
    );
  }

  return (
    <section className={styles.kpiStrip} aria-label="KPI">
      {(items ?? []).map((item) => (
        <KpiCard
          key={item.key}
          label={item.label}
          value={formatKpiValue(item)}
          delta={item.delta}
          accent={item.accent}
          icon={icons[item.key]}
        />
      ))}
    </section>
  );
}
