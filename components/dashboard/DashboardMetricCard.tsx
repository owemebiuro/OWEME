import Link from "next/link";

import styles from "./DashboardMetricCard.module.css";

type DashboardMetricCardProps = {
  label: string;
  value: string | number;
  href?: string;
  description?: string;
  tone?: "neutral" | "blue" | "amber" | "red" | "green" | "purple";
  variant?: "kpi" | "pipeline";
};

function MetricIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4" />
    </svg>
  );
}

function toneClass(tone: NonNullable<DashboardMetricCardProps["tone"]>) {
  if (tone === "amber") return styles.accent;
  if (tone === "green") return styles.green;
  if (tone === "red") return styles.red;
  if (tone === "blue") return styles.blue;
  if (tone === "purple") return styles.purple;
  return "";
}

export function DashboardMetricCard({
  label,
  value,
  href,
  description,
  tone = "neutral",
  variant = "kpi",
}: DashboardMetricCardProps) {
  const className = [
    styles.card,
    toneClass(tone),
    variant === "pipeline" ? styles.compact : "",
    href ? styles.clickable : "",
  ]
    .filter(Boolean)
    .join(" ");
  const content =
    variant === "pipeline" ? (
      <>
        <span className={styles.symbol}>
          <MetricIcon />
        </span>
        <div>
          <p className={styles.value}>{value}</p>
          <p className={styles.description}>{label}</p>
        </div>
      </>
    ) : (
      <>
        <div className={styles.top}>
          <p className={styles.label}>{label}</p>
          <span className={styles.symbol}>
            <MetricIcon />
          </span>
        </div>
        <div>
          <p className={styles.value}>{value}</p>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : (
            <span className={styles.tag}>aktywnie</span>
          )}
        </div>
      </>
    );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
