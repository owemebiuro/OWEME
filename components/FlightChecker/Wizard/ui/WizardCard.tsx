import type { ReactNode } from "react";

import styles from "../Wizard.module.css";

interface WizardCardProps {
  title?: string;
  children: ReactNode;
}

export function WizardCard({ title, children }: WizardCardProps) {
  return (
    <section className={styles.card}>
      {title ? <h2 className={styles.cardTitle}>{title}</h2> : null}
      {children}
    </section>
  );
}
