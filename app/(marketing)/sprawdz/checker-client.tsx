"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/trpc/hooks";
import styles from "./sprawdz.module.css";

type FlightResult = {
  id: string;
  flightNumber: string;
  route: string;
  delayMinutes: number | null;
  flightStatus: string;
  amountPerPassenger: number | null;
  isEligible: boolean;
  ineligibilityReason: string | null;
  airlineName: string;
};

type Step = "form" | "result" | "manual";

const FLIGHT_NUM_RE = /^[A-Z]{1,3}\d{1,4}$/i;

function formatDelay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function trackCheckerEvent(
  flightNumber: string,
  date: string,
  result: "eligible" | "not_eligible" | "not_found",
) {
  fetch("/api/tracking/checker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flightNumber, date, result }),
  }).catch(() => {});
}

export default function CheckerClient() {
  const [step, setStep] = useState<Step>("form");
  const [flightNum, setFlightNum] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [flightResult, setFlightResult] = useState<FlightResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Manual fallback form state
  const [manualDep, setManualDep] = useState("");
  const [manualArr, setManualArr] = useState("");
  const [manualDelay, setManualDelay] = useState("");

  const utils = api.useUtils();

  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    return d.toISOString().split("T")[0];
  })();

  function validateForm() {
    const errs: Record<string, string> = {};
    const num = flightNum.trim().toUpperCase().replace(/\s+/g, "");
    if (!num) errs.flightNum = "Podaj numer lotu";
    else if (!FLIGHT_NUM_RE.test(num)) errs.flightNum = "Nieprawidłowy format (np. LO123)";
    if (!flightDate) errs.flightDate = "Podaj datę lotu";
    return errs;
  }

  async function handleSearch() {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);

    const fn = flightNum.trim().toUpperCase().replace(/\s+/g, "");

    try {
      const result = await utils.flights.search.fetch({
        flightNumber: fn,
        flightDate: new Date(flightDate + "T00:00:00Z"),
      });

      if (!result) {
        setNotFound(true);
        setStep("result");
        trackCheckerEvent(fn, flightDate, "not_found");
      } else {
        setFlightResult(result);
        setNotFound(false);
        setStep("result");
        trackCheckerEvent(
          fn,
          flightDate,
          result.isEligible ? "eligible" : "not_eligible",
        );
      }
    } catch {
      setErrors({ general: "Błąd połączenia. Spróbuj ponownie." });
    } finally {
      setIsLoading(false);
    }
  }

  const totalAmount =
    flightResult?.amountPerPassenger != null
      ? flightResult.amountPerPassenger * passengerCount
      : null;

  return (
    <main className={styles.main}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.badge}>Krok 1 z 2 — Kwalifikacja</div>
        <h1 className={styles.title}>Sprawdź swój lot</h1>
        <p className={styles.subtitle}>
          Podaj numer lotu i datę — sprawdzimy bezpłatnie czy przysługuje Ci odszkodowanie.
        </p>
      </div>

      {/* STEP: FORM */}
      {step === "form" && (
        <div className={styles.card}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="flight-num">
              Numer lotu
            </label>
            <input
              id="flight-num"
              className={`${styles.input} ${errors.flightNum ? styles.inputError : ""}`}
              type="text"
              placeholder="np. LO123"
              maxLength={10}
              value={flightNum}
              onChange={(e) => setFlightNum(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {errors.flightNum && (
              <span className={styles.error}>{errors.flightNum}</span>
            )}
            <span className={styles.hint}>2–3 litery + cyfry, np. LO123, FR456</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="flight-date">
              Data lotu
            </label>
            <input
              id="flight-date"
              className={`${styles.input} ${errors.flightDate ? styles.inputError : ""}`}
              type="date"
              min={minDate}
              max={maxDate}
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
            />
            {errors.flightDate && (
              <span className={styles.error}>{errors.flightDate}</span>
            )}
          </div>

          {errors.general && (
            <div className={styles.errorBox}>{errors.general}</div>
          )}

          <button
            className={styles.btnPrimary}
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Sprawdzam dane lotu...
              </>
            ) : (
              "Sprawdź lot"
            )}
          </button>

          <p className={styles.note}>
            Bezpłatna analiza · Dane szyfrowane · Wynik w kilka sekund
          </p>
        </div>
      )}

      {/* STEP: RESULT */}
      {step === "result" && !notFound && flightResult && (
        <div className={styles.card}>
          {/* Flight info */}
          <div className={styles.flightInfo}>
            <div className={styles.flightRoute}>
              <span className={styles.flightNum}>{flightResult.flightNumber}</span>
              <span className={styles.flightSep}>·</span>
              <span className={styles.flightRouteText}>{flightResult.route}</span>
            </div>
            <div className={styles.flightMeta}>
              <span>{flightResult.airlineName}</span>
              {flightResult.delayMinutes != null && (
                <span>Opóźnienie: <strong>{formatDelay(flightResult.delayMinutes)}</strong></span>
              )}
            </div>
          </div>

          {flightResult.isEligible ? (
            <>
              <div className={styles.eligibleBanner}>
                <div className={styles.eligibleIcon}>
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className={styles.eligibleTitle}>Lot kwalifikuje się do odszkodowania</div>
                  <div className={styles.eligibleDesc}>
                    {flightResult.amountPerPassenger} EUR per pasażer na podstawie EU 261/2004
                  </div>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Liczba pasażerów</label>
                <div className={styles.stepper}>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    type="button"
                  >
                    −
                  </button>
                  <span className={styles.stepperVal}>{passengerCount}</span>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => setPassengerCount(Math.min(9, passengerCount + 1))}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Łączne odszkodowanie</span>
                <span className={styles.totalAmount}>{totalAmount} EUR</span>
              </div>

              <Link
                href={`/formularz?flightId=${flightResult.id}&passengers=${passengerCount}`}
                className={styles.btnPrimary}
              >
                Złóż wniosek za darmo →
              </Link>
            </>
          ) : (
            <div className={styles.ineligibleBanner}>
              <div className={styles.ineligibleIcon}>
                <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className={styles.ineligibleTitle}>Lot nie spełnia kryteriów</div>
                <div className={styles.ineligibleDesc}>{flightResult.ineligibilityReason}</div>
              </div>
            </div>
          )}

          <button
            className={styles.btnSecondary}
            onClick={() => {
              setStep("form");
              setFlightResult(null);
            }}
          >
            ← Sprawdź inny lot
          </button>
        </div>
      )}

      {/* NOT FOUND */}
      {step === "result" && notFound && (
        <div className={styles.card}>
          <div className={styles.notFoundBanner}>
            <div className={styles.notFoundTitle}>
              Nie możemy znaleźć danych tego lotu
            </div>
            <div className={styles.notFoundDesc}>
              Sprawdź numer i datę, lub podaj dane trasy ręcznie — i tak możemy
              złożyć wniosek w Twoim imieniu.
            </div>
          </div>

          <button
            className={styles.btnOutline}
            onClick={() => setStep("manual")}
          >
            Podaj dane trasy ręcznie
          </button>

          <button
            className={styles.btnSecondary}
            onClick={() => {
              setStep("form");
              setNotFound(false);
            }}
          >
            ← Spróbuj ponownie
          </button>
        </div>
      )}

      {/* MANUAL FORM */}
      {step === "manual" && (
        <div className={styles.card}>
          <div className={styles.manualNote}>
            Podaj dane lotu ręcznie — przeprowadzimy kwalifikację na podstawie
            Twoich informacji.
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Lotnisko wylotu (kod IATA)</label>
            <input
              className={styles.input}
              type="text"
              placeholder="np. WAW"
              maxLength={4}
              value={manualDep}
              onChange={(e) => setManualDep(e.target.value.toUpperCase())}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Lotnisko przylotu (kod IATA)</label>
            <input
              className={styles.input}
              type="text"
              placeholder="np. LHR"
              maxLength={4}
              value={manualArr}
              onChange={(e) => setManualArr(e.target.value.toUpperCase())}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Szacowane opóźnienie (minuty)</label>
            <input
              className={styles.input}
              type="number"
              placeholder="np. 240"
              min="0"
              value={manualDelay}
              onChange={(e) => setManualDelay(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Liczba pasażerów</label>
            <div className={styles.stepper}>
              <button
                className={styles.stepperBtn}
                onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                type="button"
              >
                −
              </button>
              <span className={styles.stepperVal}>{passengerCount}</span>
              <button
                className={styles.stepperBtn}
                onClick={() => setPassengerCount(Math.min(9, passengerCount + 1))}
                type="button"
              >
                +
              </button>
            </div>
          </div>

          <Link
            href={`/formularz?flightNumber=${encodeURIComponent(flightNum)}&flightDate=${flightDate}&dep=${manualDep}&arr=${manualArr}&passengers=${passengerCount}`}
            className={styles.btnPrimary}
          >
            Przejdź do formularza →
          </Link>

          <button
            className={styles.btnSecondary}
            onClick={() => setStep("form")}
          >
            ← Wróć
          </button>
        </div>
      )}
    </main>
  );
}
