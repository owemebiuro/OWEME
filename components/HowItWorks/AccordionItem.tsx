import type { KeyboardEvent } from "react";

import styles from "./HowItWorks.module.css";
import type { Step } from "./howItWorksData";

interface AccordionItemProps {
  step: Step;
  isOpen: boolean;
  onClick: () => void;
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M3 4.5 6 7.5 9 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccordionItem({ step, isOpen, onClick }: AccordionItemProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      onClick();
    }
  }

  const bodyId = `how-step-${step.id}`;

  return (
    <div className={`${styles.item} ${isOpen ? styles.open : ""}`}>
      <div
        className={styles.itemTrigger}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.itemNum}>{step.num}</div>
        <div className={styles.itemTitle}>{step.title}</div>
        <div className={styles.itemChevron}>
          <ChevronIcon />
        </div>
      </div>
      <div className={styles.itemBody} id={bodyId}>
        <div className={styles.itemBodyIn}>
          <p className={styles.itemDesc}>{step.desc}</p>
          <div className={styles.itemTags}>
            {step.tags.map((tag) => (
              <span
                key={tag.label}
                className={`${styles.tag} ${
                  tag.variant === "green" ? styles.tagGreen : ""
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
