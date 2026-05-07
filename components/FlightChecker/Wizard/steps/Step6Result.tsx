"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useWizardStore } from "../wizardStore";
import styles from "../Wizard.module.css";

interface VerifyResponse {
  eligible: boolean;
  amount?: number;
  currency?: "EUR";
  reason?: string;
  regulation: "EC261";
}

interface SubmitResponse {
  claimId: string;
  status: "pending";
}

function ResourceIcon({ type }: { type: "law" | "app" }) {
  if (type === "law") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="18" height="18">
        <path
          d="M5 17h10M7 17V7m6 10V7M4 7h12M10 3v4M6 3h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" width="18" height="18">
      <path
        d="M7 2.75h6A2.25 2.25 0 0 1 15.25 5v10A2.25 2.25 0 0 1 13 17.25H7A2.25 2.25 0 0 1 4.75 15V5A2.25 2.25 0 0 1 7 2.75ZM9 14.5h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Step6Result() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const data = useWizardStore((state) => state.data);
  const result = useWizardStore((state) => state.result);
  const setResult = useWizardStore((state) => state.setResult);
  const isLoading = useWizardStore((state) => state.isLoading);
  const setLoading = useWizardStore((state) => state.setLoading);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyClaim() {
      if (
        !data.departureAirport ||
        !data.destinationAirport ||
        !data.flightDate ||
        !data.airline ||
        !data.flightNumber ||
        !data.disruption
      ) {
        return;
      }

      setLoading(true);

      try {
        const response = await axios.post<VerifyResponse>("/api/claims/verify", {
          from: data.departureAirport.iata,
          to: data.destinationAirport.iata,
          date: data.flightDate,
          airline: data.airline.iata,
          flightNumber: data.flightNumber,
          disruption: data.disruption,
          delayHours: data.delayHours ?? undefined,
        });

        if (active) {
          setResult(response.data);
        }
      } catch {
        if (active) {
          setResult({
            eligible: false,
            reason: "Nie udało się automatycznie zweryfikować lotu.",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void verifyClaim();

    return () => {
      active = false;
    };
  }, [data, setLoading, setResult]);

  useEffect(() => {
    if (result) {
      titleRef.current?.focus();
    }
  }, [result]);

  async function submitClaim() {
    if (!data.passenger) {
      return;
    }

    setSubmitStatus("Wysyłam wniosek...");

    try {
      const response = await axios.post<SubmitResponse>("/api/claims/submit", {
        flightData: data,
        passenger: data.passenger,
      });
      setSubmitStatus(`Wniosek przyjęty: ${response.data.claimId}`);
    } catch {
      setSubmitStatus("Nie udało się złożyć wniosku. Spróbuj ponownie.");
    }
  }

  if (isLoading || !result) {
    return <p className={styles.loadingText}>Weryfikuję roszczenie...</p>;
  }

  const from = data.departureAirport;
  const to = data.destinationAirport;

  return (
    <>
      <section
        className={`${styles.resultCard} ${
          result.eligible ? styles.resultEligible : styles.resultIneligible
        }`}
      >
        <p className={styles.resultRoute}>
          {from?.flag} {from?.iata} → {to?.iata} {to?.flag}
        </p>
        <h2 ref={titleRef} tabIndex={-1} className={styles.resultTitle}>
          {result.eligible ? (
            <>
              Twój lot kwalifikuje się
              <br />
              do odszkodowania!
            </>
          ) : (
            <>
              Ten lot nie kwalifikuje się
              <br />
              do odszkodowania.
            </>
          )}
        </h2>
        {result.eligible ? (
          <p className={styles.resultAmount}>
            {result.amount ?? 400} {result.currency ?? "EUR"}
          </p>
        ) : null}
        <p className={styles.resultText}>
          {result.eligible
            ? "Na mocy EC 261/2004. Przejmujemy sprawę — bez opłat z góry."
            : result.reason ??
              "Prawa pasażerów nie obejmują nieprzewidywalnych zdarzeń, jak np. złe warunki pogodowe."}
        </p>
      </section>

      {result.eligible ? (
        <button type="button" className={styles.resultCta} onClick={submitClaim}>
          Złóż wniosek — bezpłatnie
          <span aria-hidden="true">→</span>
        </button>
      ) : null}

      {submitStatus ? <p className={styles.hint}>{submitStatus}</p> : null}

      <div className={styles.resources}>
        <Link className={styles.resourceLink} href="/wiedza">
          <span className={styles.resourceIcon}>
            <ResourceIcon type="law" />
          </span>
          <span>Poznaj swoje prawa</span>
          <span className={styles.resourceArrow}>›</span>
        </Link>
        <Link className={styles.resourceLink} href="/formularz">
          <span className={styles.resourceIcon}>
            <ResourceIcon type="app" />
          </span>
          <span>Pobierz aplikację</span>
          <span className={styles.resourceArrow}>›</span>
        </Link>
      </div>
    </>
  );
}
