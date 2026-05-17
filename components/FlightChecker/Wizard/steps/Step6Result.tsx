"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWizardStore, type WizardData } from "../wizardStore";
import styles from "../Wizard.module.css";

interface VerifyResponse {
  eligible: boolean;
  amount?: number;
  currency?: "EUR";
  reason?: string;
  regulation: "EC261";
}

interface LeadResponse {
  leadId: string;
  status: "saved";
}

type SubmitState = "idle" | "redirecting" | "error";

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

function delayMinutesFromWizard(data: WizardData) {
  if (data.disruption !== "delay") {
    return null;
  }

  if (data.delayHours === "3plus") {
    return 180;
  }

  if (data.delayHours === "less3") {
    return 120;
  }

  return null;
}

function reasonFromDisruption(data: WizardData) {
  if (data.disruption === "cancel") {
    return "CANCELLATION";
  }

  if (data.disruption === "denied") {
    return "DENIED_BOARDING";
  }

  return "DELAY";
}

function fullFlightNumber(data: WizardData) {
  const digits = data.flightNumber?.trim().replace(/\s+/g, "").toUpperCase();

  if (!digits) {
    return "";
  }

  return /^\d/.test(digits) && data.airline?.iata
    ? `${data.airline.iata.toUpperCase()}${digits}`
    : digits;
}

function buildApplicationUrl(data: WizardData, leadId: string | null) {
  const params = new URLSearchParams({
    manual: "1",
    source: "checker",
    reason: reasonFromDisruption(data),
    passengers: "1",
  });
  const delayMinutes = delayMinutesFromWizard(data);

  if (leadId) params.set("leadId", leadId);
  if (data.departureAirport) {
    params.set("departureAirportCode", data.departureAirport.iata);
  }
  if (data.destinationAirport) {
    params.set("arrivalAirportCode", data.destinationAirport.iata);
  }
  if (data.flightDate) params.set("flightDate", data.flightDate);
  if (data.airline?.name) params.set("airlineName", data.airline.name);
  if (fullFlightNumber(data)) params.set("flightNumber", fullFlightNumber(data));
  if (delayMinutes !== null) params.set("delayMinutes", String(delayMinutes));
  if (data.passenger) {
    params.set("firstName", data.passenger.firstName);
    params.set("lastName", data.passenger.lastName);
    params.set("email", data.passenger.email);
    params.set("phone", data.passenger.phone);
  }

  return `/formularz?${params.toString()}`;
}

export function Step6Result() {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const leadSaveAttemptedRef = useRef(false);
  const leadSavePromiseRef = useRef<Promise<string | null> | null>(null);
  const data = useWizardStore((state) => state.data);
  const result = useWizardStore((state) => state.result);
  const setResult = useWizardStore((state) => state.setResult);
  const isLoading = useWizardStore((state) => state.isLoading);
  const setLoading = useWizardStore((state) => state.setLoading);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const saveLead = useCallback(async () => {
    if (!data.passenger || !result) {
      return null;
    }

    if (leadId) {
      return leadId;
    }

    if (leadSavePromiseRef.current) {
      return leadSavePromiseRef.current;
    }

    const request = (async () => {
      const response = await axios.post<LeadResponse>("/api/leads", {
        flightData: data,
        passenger: data.passenger,
        result,
      });

      setLeadId(response.data.leadId);

      return response.data.leadId;
    })().finally(() => {
      leadSavePromiseRef.current = null;
    });

    leadSavePromiseRef.current = request;

    return request;
  }, [data, leadId, result]);

  useEffect(() => {
    if (!result || !data.passenger || leadId || leadSaveAttemptedRef.current) {
      return;
    }

    leadSaveAttemptedRef.current = true;
    void saveLead().catch(() => {
      // Lead capture is retried when the user clicks the application CTA.
    });
  }, [data.passenger, leadId, result, saveLead]);

  async function continueToApplication() {
    if (!data.passenger) {
      setSubmitState("error");
      setSubmitError("Uzupełnij dane kontaktowe przed przejściem do formularza.");
      return;
    }

    setSubmitState("redirecting");
    setSubmitError(null);

    try {
      const savedLeadId = leadId ?? (await saveLead());
      router.push(buildApplicationUrl(data, savedLeadId));
    } catch {
      setSubmitState("error");
      setSubmitError(
        "Nie udało się zapisać danych kontaktowych. Spróbuj ponownie.",
      );
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
            ? "Na mocy EC 261/2004. Zapisaliśmy kontakt w CRM, a pełny wniosek uzupełnisz w kolejnym formularzu."
            : result.reason ??
              "Prawa pasażerów nie obejmują nieprzewidywalnych zdarzeń, jak np. złe warunki pogodowe."}
        </p>
      </section>

      {result.eligible ? (
        <button
          type="button"
          className={styles.resultCta}
          onClick={continueToApplication}
          disabled={submitState === "redirecting"}
        >
          {submitState === "redirecting"
            ? "Przenoszę do formularza..."
            : "Złóż pełny wniosek"}
          <span aria-hidden="true">→</span>
        </button>
      ) : null}

      {submitError ? <p className={styles.submitError}>{submitError}</p> : null}

      <div className={styles.resources}>
        <Link className={styles.resourceLink} href="/twoje-prawa/odszkodowanie-za-opozniony-lot">
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
          <span>Przejdź do formularza</span>
          <span className={styles.resourceArrow}>›</span>
        </Link>
      </div>
    </>
  );
}
