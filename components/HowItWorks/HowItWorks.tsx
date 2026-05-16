"use client";

import { useState } from "react";

import { AccordionItem } from "./AccordionItem";
import styles from "./HowItWorks.module.css";
import { VisualPanel } from "./VisualPanel";
import { STEPS } from "./howItWorksData";

export function HowItWorks() {
  const [active, setActive] = useState(0);

  return (
    <section className={styles.sec} id="jak-dziala" aria-labelledby="how-title">
      <div className={styles.secGlow} />
      <div className={styles.inner}>
        <div className={styles.hd}>
          <span className={styles.eyebrow}>Prosty proces</span>
          <h2 className={styles.h2} id="how-title">
            Jak działa oweme?
          </h2>
          <p className={styles.lead}>
            Od złożenia wniosku do przelewu — bez korespondencji z linią, bez
            sądów, bez ryzyka finansowego.
          </p>
        </div>

        <div className={styles.layout}>
          <div className={styles.accordion}>
            {STEPS.map((step) => (
              <AccordionItem
                key={step.id}
                step={step}
                isOpen={active === step.id}
                onClick={() => setActive(step.id)}
              />
            ))}
          </div>
          <VisualPanel activeId={active} />
        </div>
      </div>
    </section>
  );
}
