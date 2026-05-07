import { WizardProgress } from "./WizardProgress";
import styles from "./Wizard.module.css";

export function WizardSidebar({ currentStep }: { currentStep: number }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} aria-label="oweme">
        <span className={styles.logoInk}>owe</span>
        <span className={styles.logoEmber}>me.</span>
      </div>
      <WizardProgress currentStep={currentStep} />
    </aside>
  );
}
