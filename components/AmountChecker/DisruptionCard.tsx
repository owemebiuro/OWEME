"use client";

import type { KeyboardEvent, ReactNode } from "react";

import styles from "./AmountChecker.module.css";

interface DisruptionCardProps {
  icon: ReactNode;
  name: string;
  desc: string;
  badge: string;
  controlsId?: string;
  isActive: boolean;
  onClick: () => void;
}

export function DisruptionCard({
  icon,
  name,
  desc,
  badge,
  controlsId,
  isActive,
  onClick,
}: DisruptionCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div
      role="radio"
      aria-checked={isActive}
      aria-controls={controlsId}
      tabIndex={0}
      className={`${styles.disCard} ${isActive ? styles.disCardActive : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.disBadge}>{badge}</span>
      <span className={styles.disIc}>{icon}</span>
      <span className={styles.disCopy}>
        <span className={styles.disName}>{name}</span>
        <span className={styles.disDesc}>{desc}</span>
      </span>
    </div>
  );
}
