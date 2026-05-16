import styles from "../HowItWorks.module.css";

interface PanelProps {
  className: string;
}

const TIERS = [
  { km: "do 1 500 km", amt: "250 €", hi: false },
  { km: "1 500 - 3 500 km", amt: "400 €", hi: true },
  { km: "powyżej 3 500 km", amt: "600 €", hi: false },
];

export function PanelAmountTiers({ className }: PanelProps) {
  return (
    <div className={className} aria-label="Progi odszkodowania EC 261">
      <div className={styles.p2Tiers}>
        {TIERS.map((tier) => (
          <div
            key={tier.amt}
            className={`${styles.p2Tier} ${tier.hi ? styles.p2TierHi : ""}`}
          >
            <span className={styles.p2Km}>{tier.km}</span>
            <strong className={styles.p2Amt}>{tier.amt}</strong>
          </div>
        ))}
      </div>

      <div className={styles.p2Progress}>
        <div className={styles.p2ProgressLabels}>
          <span>Skuteczność roszczeń</span>
          <span className={styles.p2ProgressPct}>87%</span>
        </div>
        <div className={styles.p2ProgressTrack}>
          <div className={styles.p2ProgressFill} style={{ width: "87%" }} />
        </div>
      </div>

      <div className={styles.panelCaption}>
        Kwota na mocy rozporządzenia UE nr 261/2004
      </div>
    </div>
  );
}
