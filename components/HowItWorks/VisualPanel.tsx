import { PanelAmountTiers } from "./panels/PanelAmountTiers";
import { PanelFlightRoute } from "./panels/PanelFlightRoute";
import { PanelLetter } from "./panels/PanelLetter";
import { PanelSettlement } from "./panels/PanelSettlement";
import styles from "./HowItWorks.module.css";

interface VisualPanelProps {
  activeId: number;
}

export function VisualPanel({ activeId }: VisualPanelProps) {
  return (
    <div className={styles.visual} aria-live="polite">
      <PanelFlightRoute
        className={`${styles.panel} ${activeId === 0 ? styles.active : ""}`}
      />
      <PanelAmountTiers
        className={`${styles.panel} ${activeId === 1 ? styles.active : ""}`}
      />
      <PanelLetter
        className={`${styles.panel} ${activeId === 2 ? styles.active : ""}`}
      />
      <PanelSettlement
        className={`${styles.panel} ${activeId === 3 ? styles.active : ""}`}
      />
    </div>
  );
}
