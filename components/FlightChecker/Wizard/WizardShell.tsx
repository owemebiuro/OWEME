"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { Step1Route } from "./steps/Step1Route";
import { Step2Details } from "./steps/Step2Details";
import { Step3Problem } from "./steps/Step3Problem";
import { Step4Delay } from "./steps/Step4Delay";
import { Step5Passenger } from "./steps/Step5Passenger";
import { Step6Result } from "./steps/Step6Result";
import { WizardSidebar } from "./WizardSidebar";
import { WizardActions } from "./ui/WizardActions";
import type { Airline, Airport } from "./wizardStore";
import { useWizardStore } from "./wizardStore";
import styles from "./Wizard.module.css";

interface WizardShellProps {
  initialDepartureAirport?: Airport | null;
  initialDestinationAirport?: Airport | null;
  initialFlightDate?: string | null;
  initialAirline?: Airline | null;
  initialFlightNumber?: string | null;
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 2.25 14.25 4v3.9c0 3.1-2.08 5.98-5.25 7.1-3.17-1.12-5.25-4-5.25-7.1V4L9 2.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m6.75 8.9 1.45 1.45 3.25-3.55"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderStep(currentStep: number) {
  switch (currentStep) {
    case 0:
      return <Step1Route />;
    case 1:
      return <Step2Details />;
    case 2:
      return <Step3Problem />;
    case 3:
      return <Step4Delay />;
    case 4:
      return <Step5Passenger />;
    default:
      return <Step6Result />;
  }
}

function mobilePhase(currentStep: number) {
  if (currentStep <= 3) {
    return 1;
  }

  if (currentStep === 4) {
    return 2;
  }

  return 4;
}

export function WizardShell({
  initialDepartureAirport = null,
  initialDestinationAirport = null,
  initialFlightDate = null,
  initialAirline = null,
  initialFlightNumber = null,
}: WizardShellProps) {
  const initialized = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const currentStep = useWizardStore((state) => state.currentStep);
  const data = useWizardStore((state) => state.data);
  const canProceed = useWizardStore((state) => state.canProceed);
  const nextStep = useWizardStore((state) => state.nextStep);
  const prevStep = useWizardStore((state) => state.prevStep);
  const setData = useWizardStore((state) => state.setData);
  const canContinue = canProceed();
  const showBreadcrumb = currentStep >= 1;
  const routeLabel =
    data.departureAirport && data.destinationAirport
      ? `${data.departureAirport.iata} → ${data.destinationAirport.iata}`
      : null;

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;
    setData({
      departureAirport: initialDepartureAirport,
      destinationAirport: initialDestinationAirport,
      flightDate: initialFlightDate,
      airline: initialAirline,
      flightNumber: initialFlightNumber,
    });
  }, [
    initialAirline,
    initialDepartureAirport,
    initialDestinationAirport,
    initialFlightDate,
    initialFlightNumber,
    setData,
  ]);

  return (
    <div className={styles.shell}>
      <WizardSidebar currentStep={currentStep} />
      <div className={styles.mobileStrip}>
        <div className={styles.logo} aria-label="oweme">
          <span className={styles.logoInk}>owe</span>
          <span className={styles.logoEmber}>me.</span>
        </div>
        <span className={styles.mobileProgress}>
          Krok {mobilePhase(currentStep)}/4
        </span>
      </div>
      <main className={styles.content}>
        <div className={styles.contentInner}>
          <div className={styles.topbar}>
            <ShieldIcon />
            <span>Chronimy Twoje prawa jako pasażera</span>
          </div>
          {showBreadcrumb && routeLabel ? (
            <div className={styles.breadcrumb}>
              {data.departureAirport?.iata}
              <span className={styles.breadcrumbArrow}>→</span>
              {data.destinationAirport?.iata}
            </div>
          ) : null}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className={styles.stepWrap}
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -20 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.2,
                ease: "easeInOut",
              }}
            >
              {renderStep(currentStep)}
            </motion.div>
          </AnimatePresence>
          {currentStep < 5 ? (
            <WizardActions
              onBack={currentStep > 0 ? prevStep : undefined}
              onContinue={nextStep}
              canContinue={canContinue}
              continueLabel={currentStep === 4 ? "Sprawdź wynik" : "Dalej"}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
