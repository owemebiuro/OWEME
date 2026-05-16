import styles from "../HowItWorks.module.css";

interface PanelProps {
  className: string;
}

export function PanelSettlement({ className }: PanelProps) {
  return (
    <div className={className} aria-label="Rozliczenie prowizji">
      <div className={styles.p4Box}>
        <div className={styles.p4Head}>
          <span>Rozliczenie</span>
          <strong>Success fee po wygranej sprawie</strong>
        </div>

        <div className={`${styles.p4Row} ${styles.p4Highlight}`}>
          <span>Linia lotnicza → oweme</span>
          <strong>1 716 zł</strong>
        </div>

        <div className={styles.p4Separator}>
          <span />
          <strong>prowizja 25%</strong>
          <span />
        </div>

        <div className={`${styles.p4Row} ${styles.p4Sage}`}>
          <span>oweme → Ty</span>
          <strong>1 287 zł</strong>
        </div>

        <div className={styles.p4Row}>
          <span>Prowizja oweme</span>
          <strong>429 zł</strong>
        </div>
      </div>
      <div className={styles.panelCaption}>Przegrana = 0 zł dla Ciebie</div>
    </div>
  );
}
