import { addDays, isEqual } from "date-fns";

import type { LimitationData } from "@/lib/limitation/limitation.types";
import {
  formatDaysRemaining,
  formatLimitationDate,
  formatShortLimitationDate,
  getLimitationBadgeVariant,
} from "@/lib/limitation/limitation.utils";

import styles from "./LimitationBadge.module.css";

type LimitationBadgeProps = {
  data: LimitationData;
  variant?: "compact" | "full";
};

const statusIcons = {
  expired: "⚠",
  urgent: "⚠",
  warning: "⚠",
  suspended: "⏸",
  safe: "✓",
} as const;

function compactDays(days: number) {
  if (days < 0) {
    return `${Math.abs(days)} dni po terminie`;
  }

  if (days === 0) {
    return "dziś";
  }

  if (days === 1) {
    return "1 dzień";
  }

  return `${days} dni`;
}

function getMainStatus(data: LimitationData) {
  if (data.status === "expired") {
    return "PRZEDAWNIONE";
  }

  if (data.isSuspendedNow) {
    return "BIEG ZAWIESZONY";
  }

  if (data.daysRemaining <= 60) {
    return `KOŃCZY SIĘ ${formatDaysRemaining(data.daysRemaining).toUpperCase()}`;
  }

  return `POZOSTAŁO ${formatDaysRemaining(data.daysRemaining).toUpperCase()}`;
}

function getSuspensionNote(data: LimitationData) {
  if (!data.suspensionStartDate || !data.suspensionEndDate) {
    return null;
  }

  const autoEndDate = addDays(data.suspensionStartDate, 30);
  const endedByAnswer =
    data.complaintAnsweredAt && isEqual(data.suspensionEndDate, data.complaintAnsweredAt);

  if (endedByAnswer) {
    return `${data.suspensionDays} dni - odpowiedź na reklamację`;
  }

  if (isEqual(data.suspensionEndDate, autoEndDate)) {
    return `${data.suspensionDays} dni - brak odpowiedzi w terminie`;
  }

  return `${data.suspensionDays} dni zawieszenia`;
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export function LimitationBadge({
  data,
  variant = "compact",
}: LimitationBadgeProps) {
  const badgeVariant = getLimitationBadgeVariant(data.status, data.daysRemaining);
  const icon = statusIcons[badgeVariant];

  if (variant === "compact") {
    const compactLabel = `Przedawnienie: ${compactDays(
      data.daysRemaining,
    )} (${formatShortLimitationDate(data.finalExpiryDate)})`;

    return (
      <span
        className={[styles.badge, styles[badgeVariant]].join(" ")}
        title={compactLabel}
      >
        <span aria-hidden="true">{icon}</span>
        <span>{compactLabel}</span>
      </span>
    );
  }

  if (data.isSuspendedNow) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <span className={styles.panelTitle}>Termin przedawnienia</span>
          <span className={styles.panelRef}>art. 205c</span>
        </header>
        <div className={styles.panelMain}>
          <p className={[styles.mainStatus, styles[badgeVariant]].join(" ")}>
            {icon} {getMainStatus(data)}
          </p>
          {data.complaintFiledAt ? (
            <p className={styles.mainDate}>
              Reklamacja złożona {formatLimitationDate(data.complaintFiledAt)}
            </p>
          ) : null}
          {data.suspensionEndsAt ? (
            <Row
              label="Zawieszenie trwa do"
              value={formatShortLimitationDate(data.suspensionEndsAt)}
              className={styles.suspRow}
            />
          ) : null}
          <p className={styles.suspNote}>
            Brak odpowiedzi oznacza automatyczny koniec po 30 dniach.
          </p>
          <div className={styles.divider} />
          <Row
            label="Termin po wznowieniu"
            value="obliczany na bieżąco"
          />
        </div>
        <footer className={styles.footnote}>
          Podstawa: art. 205c ust. 7-8 Prawa Lotniczego
        </footer>
      </section>
    );
  }

  const suspensionNote = getSuspensionNote(data);

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <span className={styles.panelTitle}>Termin przedawnienia</span>
        <span className={styles.panelRef}>art. 205c</span>
      </header>
      <div className={styles.panelMain}>
        <p className={[styles.mainStatus, styles[badgeVariant]].join(" ")}>
          {icon} {getMainStatus(data)}
        </p>
        <p className={styles.mainDate}>
          {formatLimitationDate(data.finalExpiryDate)}
        </p>

        <div className={styles.divider} />
        <Row label="Data lotu" value={formatShortLimitationDate(data.flightDate)} />
        <Row label="Bieg od" value={formatShortLimitationDate(data.flightDate)} />
        <Row
          label="Bazowy termin"
          value={formatShortLimitationDate(data.baseExpiryDate)}
        />

        {data.suspensionStartDate && data.suspensionEndDate ? (
          <>
            <div className={styles.divider} />
            <Row
              label="⏸ Zawieszenie"
              value={`${formatShortLimitationDate(
                data.suspensionStartDate,
              )} - ${formatShortLimitationDate(data.suspensionEndDate)}`}
              className={styles.suspRow}
            />
            {suspensionNote ? (
              <p className={styles.suspNote}>({suspensionNote})</p>
            ) : null}
          </>
        ) : null}

        <div className={styles.divider} />
        <Row
          label="Termin ostateczny"
          value={`${formatShortLimitationDate(data.finalExpiryDate)} (+${
            data.suspensionDays
          } dni zawieszenia)`}
        />
        <Row label="Pozostało" value={formatDaysRemaining(data.daysRemaining)} />
      </div>
      <footer className={styles.footnote}>
        Podstawa: art. 205c ust. 7-8 Prawa Lotniczego
      </footer>
    </section>
  );
}
