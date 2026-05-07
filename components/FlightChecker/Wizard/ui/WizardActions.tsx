"use client";

import styles from "../Wizard.module.css";

interface WizardActionsProps {
  onBack?: () => void;
  onContinue: () => void;
  canContinue: boolean;
  continueLabel?: string;
}

export function WizardActions({
  onBack,
  onContinue,
  canContinue,
  continueLabel = "Dalej",
}: WizardActionsProps) {
  return (
    <div className={styles.actions}>
      {onBack ? (
        <button type="button" className={styles.backButton} onClick={onBack}>
          Wstecz
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <button
        type="button"
        className={`${styles.continueButton} ${
          canContinue ? "" : styles.continueButtonDisabled
        }`}
        onClick={onContinue}
        disabled={!canContinue}
      >
        {continueLabel}
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2.5 7h9M8 3.5 11.5 7 8 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
