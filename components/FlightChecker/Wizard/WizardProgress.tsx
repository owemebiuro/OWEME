import styles from "./Wizard.module.css";

const progressItems = [
  "Weryfikacja kwalifikacji",
  "Informacje dodatkowe",
  "Dokumenty",
  "Gotowe",
] as const;

function phaseForStep(currentStep: number) {
  if (currentStep <= 3) {
    return 1;
  }

  if (currentStep === 4) {
    return 2;
  }

  return 4;
}

export function WizardProgress({ currentStep }: { currentStep: number }) {
  const activePhase = phaseForStep(currentStep);

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={activePhase}
    >
      {progressItems.map((label, index) => {
        const phase = index + 1;
        const done = phase < activePhase;
        const active = phase === activePhase;

        return (
          <div key={label}>
            <div className={styles.progressItem}>
              <span
                className={`${styles.progressDot} ${
                  done
                    ? styles.progressDotDone
                    : active
                      ? styles.progressDotActive
                      : ""
                }`}
                aria-hidden="true"
              >
                {done ? "✓" : null}
              </span>
              <span
                className={`${styles.progressLabel} ${
                  active ? styles.progressLabelActive : ""
                }`}
              >
                {label}
              </span>
            </div>
            {index < progressItems.length - 1 ? (
              <div className={styles.progressConnector} aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
