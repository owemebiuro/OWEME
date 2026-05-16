"use client";

import type { ReactNode } from "react";

import styles from "./AnalyticsDashboard.module.css";

export function Panel({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.panel} panel ${className}`}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>{title}</h2>
          {subtitle ? <p className={styles.panelSub}>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ChartSkeleton({ rows = 0 }: { rows?: number }) {
  return (
    <>
      <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      {rows ? (
        <div className={styles.skeletonRows}>
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              className={`${styles.skeleton} ${styles.skeletonLine}`}
              style={{ width: `${92 - index * 9}%` }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

export function EmptyState({ label = "Brak danych do wyświetlenia." }) {
  return <div className={styles.emptyState}>{label}</div>;
}
