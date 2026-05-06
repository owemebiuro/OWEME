"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import styles from "@/app/landing.module.css";
import {
  isLikelyEligibleFlight,
} from "@/lib/flightaware/flight-eligibility";
import type { FlightDataLookupResult } from "@/lib/flightaware/aeroapi.types";
import { api } from "@/lib/trpc/hooks";

type ManualFlightData = {
  departureAirportCode: string;
  arrivalAirportCode: string;
  delayMinutes: string;
};

const flightNumberPattern = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i;

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

function buildFormUrl(input: {
  result: FlightDataLookupResult | null;
  passengers: number;
  flightNumber: string;
  flightDate: string;
  manual: ManualFlightData;
}) {
  const params = new URLSearchParams();
  const manualDelay = Number(input.manual.delayMinutes);
  const manualMode = !input.result?.found || !input.result.flight?.id;

  params.set("passengers", String(input.passengers));
  params.set("source", "checker");

  if (!manualMode && input.result?.flight?.id) {
    params.set("flightId", input.result.flight.id);
    return `/formularz?${params.toString()}`;
  }

  params.set("manual", "1");
  params.set(
    "flightNumber",
    input.result?.flight?.flightNumber ?? normalizeFlightNumber(input.flightNumber),
  );
  params.set(
    "flightDate",
    input.result?.flight?.flightDate ?? input.flightDate,
  );
  params.set(
    "departureAirportCode",
    input.result?.flight?.departureAirportCode || input.manual.departureAirportCode,
  );
  params.set(
    "arrivalAirportCode",
    input.result?.flight?.arrivalAirportCode || input.manual.arrivalAirportCode,
  );

  if (Number.isFinite(manualDelay)) {
    params.set("delayMinutes", String(manualDelay));
  } else if (input.result?.flight?.delayMinutes !== null && input.result?.flight?.delayMinutes !== undefined) {
    params.set("delayMinutes", String(input.result.flight.delayMinutes));
  }

  return `/formularz?${params.toString()}`;
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

export function CompensationChecker() {
  const bounds = useMemo(() => getDateBounds(), []);
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [manual, setManual] = useState<ManualFlightData>({
    departureAirportCode: "",
    arrivalAirportCode: "",
    delayMinutes: "",
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<FlightDataLookupResult | null>(null);
  const utils = api.useUtils();
  const manualMode = !result?.found;
  const configurationIssue = isFlightProviderConfigurationIssue(result);
  const likelyEligible =
    result?.found && result.flight
      ? isLikelyEligibleFlight({
          delayMinutes: result.flight.delayMinutes,
          flightStatus: result.flight.flightStatus,
        })
      : false;
  const amountPerPassenger = result?.compensation.amountEur ?? 0;
  const totalAmount = amountPerPassenger * passengers;
  const formUrl = buildFormUrl({
    result,
    passengers,
    flightNumber,
    flightDate,
    manual,
  });

  function validateStepOne() {
    const normalized = normalizeFlightNumber(flightNumber);

    if (!flightNumberPattern.test(flightNumber.trim())) {
      return "Wpisz numer lotu, np. LO123 albo W6 789.";
    }

    if (!flightDate) {
      return "Wybierz datę lotu.";
    }

    if (flightDate < bounds.min || flightDate > bounds.max) {
      return "Data lotu musi być z przeszłości i maksymalnie 3 lata wstecz.";
    }

    if (normalized.length < 3) {
      return "Numer lotu jest zbyt krótki.";
    }

    return null;
  }

  async function handleSubmit() {
    const error = validateStepOne();

    setFieldError(error);
    setSearchError(null);

    if (error) {
      return;
    }

    setIsChecking(true);

    try {
      const data = await utils.flights.searchPublic.fetch({
        flightNumber: normalizeFlightNumber(flightNumber),
        date: flightDate,
      });

      setResult(data);
      setManual({
        departureAirportCode: data.flight?.departureAirportCode ?? "",
        arrivalAirportCode: data.flight?.arrivalAirportCode ?? "",
        delayMinutes:
          data.flight?.delayMinutes === null || data.flight?.delayMinutes === undefined
            ? ""
            : String(data.flight.delayMinutes),
      });
      setStep(2);
    } catch {
      setSearchError(
        "Nie udało się sprawdzić lotu. Spróbuj ponownie albo wybierz ręczne uzupełnienie danych.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className={styles.funnelCard}>
      <div className={styles.funnelSteps} aria-label="Postęp checkera">
        <span className={step === 1 ? styles.funnelStepActive : undefined}>
          1. Dane lotu
        </span>
        <span className={step === 2 ? styles.funnelStepActive : undefined}>
          2. Wynik
        </span>
      </div>

      {step === 1 ? (
        <div className={styles.funnelForm}>
          <label className={styles.funnelField}>
            <span>Numer lotu</span>
            <input
              value={flightNumber}
              onChange={(event) => setFlightNumber(event.target.value)}
              placeholder="np. LO123"
              autoComplete="off"
            />
          </label>

          <label className={styles.funnelField}>
            <span>Data lotu</span>
            <input
              value={flightDate}
              onChange={(event) => setFlightDate(event.target.value)}
              type="date"
              min={bounds.min}
              max={bounds.max}
            />
          </label>

          {fieldError ? <p className={styles.funnelError}>{fieldError}</p> : null}

          {searchError ? (
            <p className={styles.funnelError}>{searchError}</p>
          ) : null}

          <button
            type="button"
            className={styles.funnelButton}
            onClick={handleSubmit}
            disabled={isChecking}
          >
            {isChecking ? "Sprawdzam dane lotu..." : "Sprawdź lot"}
          </button>
        </div>
      ) : null}

      {step === 2 && result ? (
        <div className={styles.funnelResult}>
          <button
            type="button"
            className={styles.funnelBack}
            onClick={() => setStep(1)}
          >
            Zmień dane lotu
          </button>

          <div
            className={`${styles.funnelResultBanner} ${
              manualMode
                ? styles.funnelResultManual
                : likelyEligible
                  ? styles.funnelResultGood
                  : styles.funnelResultMuted
            }`}
          >
            <h2>
              {!result.found
                ? configurationIssue
                  ? "Brakuje konfiguracji integracji lotniczej"
                  : "Nie znaleźliśmy lotu"
                : likelyEligible
                  ? "Znaleziono lot i możliwe roszczenie"
                  : "Znaleziono lot"}
            </h2>
            <p>
              {!result.found
                ? result.error ??
                  "Nie znaleźliśmy lotu o podanym numerze i dacie. Sprawdź numer lotu albo wybierz ręczne uzupełnienie danych."
                : result.compensation.reason}
            </p>
          </div>

          {result.flight ? (
            <dl className={styles.funnelSummary}>
              <div>
                <dt>Numer lotu</dt>
                <dd>{result.flight.flightNumber}</dd>
              </div>
              <div>
                <dt>Linia lotnicza</dt>
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
                <dd>
                  {formatDateTime(
                    result.flight.actualDeparture ?? result.flight.scheduledDeparture,
                  )}
                </dd>
              </div>
              <div>
                <dt>Lądowanie</dt>
                <dd>
                  {formatDateTime(
                    result.flight.actualArrival ?? result.flight.scheduledArrival,
                  )}
                </dd>
              </div>
              <div>
                <dt>Długość trasy</dt>
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

          {manualMode ? (
            <div className={styles.manualGrid}>
              <label className={styles.funnelField}>
                <span>Lotnisko wylotu</span>
                <input
                  value={manual.departureAirportCode}
                  onChange={(event) =>
                    setManual((current) => ({
                      ...current,
                      departureAirportCode: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="np. WAW"
                  maxLength={3}
                />
              </label>
              <label className={styles.funnelField}>
                <span>Lotnisko przylotu</span>
                <input
                  value={manual.arrivalAirportCode}
                  onChange={(event) =>
                    setManual((current) => ({
                      ...current,
                      arrivalAirportCode: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="np. LHR"
                  maxLength={3}
                />
              </label>
              <label className={styles.funnelField}>
                <span>Opóźnienie w minutach</span>
                <input
                  value={manual.delayMinutes}
                  onChange={(event) =>
                    setManual((current) => ({
                      ...current,
                      delayMinutes: event.target.value.replace(/\D+/g, ""),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="np. 240"
                />
              </label>
            </div>
          ) : null}

          <label className={styles.funnelField}>
            <span>Liczba pasażerów</span>
            <input
              value={passengers}
              onChange={(event) => setPassengers(Number(event.target.value))}
              type="number"
              min={1}
              max={9}
            />
          </label>

          <div className={styles.totalBox}>
            <span>Łącznie</span>
            <strong>{totalAmount ? `${totalAmount} EUR` : "Do wyliczenia"}</strong>
          </div>

          {result.warnings.length ? (
            <p className={styles.funnelHint}>
              {result.warnings[0]}
            </p>
          ) : null}

          <Link href={formUrl} className={styles.funnelButton}>
            Złóż wniosek za darmo
          </Link>
        </div>
      ) : null}
    </div>
  );
}
