"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import styles from "@/app/landing.module.css";
import type { FlightDataLookupResult } from "@/lib/flightaware/aeroapi.types";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateBounds() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 3);

  return {
    min: toDateInputValue(minDate),
    max: toDateInputValue(yesterday),
  };
}

function normalizeFlightNumber(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Brak danych";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Brak danych";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildManualFormUrl(input: {
  flightNumber: string;
  flightDate: string;
}) {
  const params = new URLSearchParams({
    manual: "1",
    passengers: "1",
    flightNumber: normalizeFlightNumber(input.flightNumber),
    flightDate: input.flightDate,
  });

  return `/formularz?${params.toString()}`;
}

function buildSuccessFormUrl(result: FlightDataLookupResult) {
  const params = new URLSearchParams({
    passengers: "1",
  });

  if (result.flight?.id) {
    params.set("flightId", result.flight.id);
    return `/formularz?${params.toString()}`;
  }

  return buildManualFormUrl({
    flightNumber: result.flight?.flightNumber ?? "",
    flightDate: result.flight?.flightDate ?? "",
  });
}

function isFlightProviderConfigurationIssue(
  result: FlightDataLookupResult | null,
) {
  return Boolean(
    result?.error?.includes(
      "Integracja lotnicza nie jest jeszcze skonfigurowana",
    ),
  );
}

export default function FlightChecker() {
  const bounds = useMemo(() => getDateBounds(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<FlightDataLookupResult | null>(null);

  function validate() {
    if (!/^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i.test(flightNumber.trim())) {
      return "Wpisz poprawny numer lotu, np. LO123.";
    }

    if (!flightDate) {
      return "Wybierz datę lotu.";
    }

    if (flightDate < bounds.min || flightDate > bounds.max) {
      return "Data lotu musi być z przeszłości i maksymalnie 3 lata wstecz.";
    }

    return null;
  }

  async function handleCheck() {
    const error = validate();
    setFieldError(error);
    setResult(null);

    if (error) {
      inputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/check-flight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: normalizeFlightNumber(flightNumber),
          date: flightDate,
        }),
      });

      const data = (await response.json()) as FlightDataLookupResult;
      setResult(data);
    } catch {
      setResult({
        found: false,
        flight: null,
        compensation: {
          amountEur: null,
          category: null,
          reason:
            "Nie udało się pobrać danych lotu. Spróbuj ponownie albo wybierz ręczne uzupełnienie danych.",
        },
        error:
          "Nie udało się pobrać danych lotu. Spróbuj ponownie albo wybierz ręczne uzupełnienie danych.",
        warnings: [],
        cacheHit: false,
        persistedFlightId: null,
      });
    } finally {
      setLoading(false);
    }
  }

  const manualFormUrl = buildManualFormUrl({
    flightNumber,
    flightDate,
  });
  const configurationIssue = isFlightProviderConfigurationIssue(result);

  return (
    <div className={styles.checkerWrap}>
      <div className={styles.checkerLabel}>Numer lotu</div>
      <div className={styles.checkerPill}>
        <input
          ref={inputRef}
          className={styles.checkerInput}
          type="text"
          placeholder="np. LO123"
          maxLength={10}
          autoComplete="off"
          value={flightNumber}
          onChange={(event) => setFlightNumber(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleCheck()}
        />
      </div>

      <div className={styles.checkerDateWrap}>
        <div className={styles.checkerLabel}>Data lotu</div>
        <div className={styles.checkerDatePill}>
          <input
            className={styles.checkerDateInput}
            type="date"
            min={bounds.min}
            max={bounds.max}
            value={flightDate}
            onChange={(event) => setFlightDate(event.target.value)}
          />
          <button
            className={styles.checkerBtn}
            onClick={handleCheck}
            disabled={loading}
            type="button"
          >
            {loading && <span className={styles.spinner} />}
            {loading ? "Analizuję..." : "Sprawdź"}
          </button>
        </div>
      </div>

      {fieldError ? <p className={styles.checkerError}>{fieldError}</p> : null}

      <div className={styles.checkerSub}>
        <span className={styles.checkerSubItem}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#9e8e7e" strokeWidth="1" />
            <path
              d="M6 5v3.5M6 3.5v.5"
              stroke="#9e8e7e"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          Bezpłatna analiza
        </span>
        <span className={styles.checkerSubItem}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect
              x="2"
              y="4"
              width="8"
              height="6"
              rx="1"
              stroke="#9e8e7e"
              strokeWidth="1"
            />
            <path
              d="M4 4V3a2 2 0 014 0v1"
              stroke="#9e8e7e"
              strokeWidth="1"
            />
          </svg>
          Dane szyfrowane
        </span>
        <span className={styles.checkerSubItem}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#9e8e7e" strokeWidth="1" />
            <path
              d="M4 6l1.5 1.5L8 4"
              stroke="#9e8e7e"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Wynik natychmiast
        </span>
      </div>

      {result ? (
        <div
          className={`${styles.resultBubble} ${
            result.found ? styles.resultBubbleEligible : ""
          }`}
        >
          <div className={styles.resultRow}>
            <div
              className={styles.resultDot}
              style={{
                background: result.found ? "var(--orange-mid)" : "#c8bdb5",
              }}
            >
              {result.found ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8l4 4 6-6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M5 5l6 6M11 5l-6 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <div className={styles.resultContent}>
              <div
                className={`${styles.resultTitle} ${
                  !result.found ? styles.resultTitleNone : ""
                }`}
              >
                {result.found
                  ? "Znaleziono lot"
                  : configurationIssue
                    ? "Brakuje konfiguracji lotów"
                    : "Nie znaleźliśmy lotu"}
              </div>
              <div className={styles.resultDesc}>
                {result.error ?? result.compensation.reason}
              </div>
              {result.warnings.length ? (
                <div className={styles.resultInlineNote}>{result.warnings[0]}</div>
              ) : null}

              {result.flight ? (
                <dl className={styles.resultMetaGrid}>
                  <div>
                    <dt>Numer</dt>
                    <dd>{result.flight.flightNumber}</dd>
                  </div>
                  <div>
                    <dt>Linia</dt>
                    <dd>{result.flight.airlineName ?? "Brak danych"}</dd>
                  </div>
                  <div>
                    <dt>Wylot</dt>
                    <dd>
                      {result.flight.departureAirportCode ?? "?"}
                      {result.flight.departureAirportName
                        ? ` - ${result.flight.departureAirportName}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Przylot</dt>
                    <dd>
                      {result.flight.arrivalAirportCode ?? "?"}
                      {result.flight.arrivalAirportName
                        ? ` - ${result.flight.arrivalAirportName}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Start</dt>
                    <dd>{formatDateTime(result.flight.actualDeparture ?? result.flight.scheduledDeparture)}</dd>
                  </div>
                  <div>
                    <dt>Lądowanie</dt>
                    <dd>{formatDateTime(result.flight.actualArrival ?? result.flight.scheduledArrival)}</dd>
                  </div>
                  <div>
                    <dt>Trasa</dt>
                    <dd>
                      {result.flight.distanceKm
                        ? `${result.flight.distanceKm} km`
                        : "Do weryfikacji"}
                    </dd>
                  </div>
                  <div>
                    <dt>Opóźnienie</dt>
                    <dd>
                      {result.flight.delayMinutes !== null
                        ? `${result.flight.delayMinutes} min`
                        : "Brak danych"}
                    </dd>
                  </div>
                </dl>
              ) : null}

              {result.compensation.amountEur ? (
                <div className={styles.resultAmount}>
                  {result.compensation.amountEur} EUR
                </div>
              ) : (
                <div className={styles.resultInlineNote}>
                  Nie możemy automatycznie wyliczyć kwoty, ale możesz złożyć
                  wniosek do ręcznej weryfikacji.
                </div>
              )}

              <div className={styles.resultActions}>
                <Link
                  href={result.found ? buildSuccessFormUrl(result) : manualFormUrl}
                  className={styles.resultCta}
                >
                  {result.found ? "Złóż wniosek" : "Uzupełnij dane ręcznie"}
                </Link>
                <Link href="/sprawdz" className={styles.resultGhostCta}>
                  Otwórz pełny checker
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
