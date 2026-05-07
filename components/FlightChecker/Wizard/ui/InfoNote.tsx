import type { ReactNode } from "react";

import styles from "../Wizard.module.css";

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className={styles.infoNote}>
      <span className={styles.infoIcon} aria-hidden="true">
        ℹ
      </span>
      <span>{children}</span>
    </div>
  );
}
