"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ApiDataSource, ClaimAmountCategory, FlightStatus } from "@prisma/client";

import styles from "@/app/landing.module.css";
import { api } from "@/lib/trpc/hooks";

type ManualFlightData = {
  departureAirportCode: string;
  arrivalAirportCode: string;
  delayMinutes: string;
};

type FlightSearchResult = {
  data: {
    flightNumber: string;
    flightDate: string;
    departureAirportCode: string;
    arrivalAirportCode: string;
    delayMinutes: number | null;
    flightStatus: FlightStatus;
    amountCategory?: ClaimAmountCategory | null;
    dataSource: ApiDataSource;
  };
  warnings: string[];
  persistedFlightId: string | null;
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

function formatRoute(result: FlightSearchResult | null) {
  const departure = result?.data.departureAirportCode;
  const arrival = result?.data.arrivalAirportCode;

  if (!departure || !arrival) {
    return "Dane trasy do uzupełnienia";
  }

  return `${departure} → ${arrival}`;
}

function amountFromCategory(category: ClaimAmountCategory | null | undefined) {
  if (category === "EUR_250") {
    return 250;
  }

  if (category === "EUR_400") {
    return 400;
  }

  if (category === "EUR_600") {
    return 600;
  }

  return null;
}

function estimateAmountPerPassenger(result: FlightSearchResult | null) {
  if (!result) {
    return 0;
  }

  const categoryAmount = amountFromCategory(result.data.amountCategory);

  if (categoryAmount) {
    return categoryAmount;
  }

  if (result.data.flightStatus === "CANCELLED") {
    return 600;
  }

  if ((result.data.delayMinutes ?? 0) >= 180) {
    return 600;
  }

  return 0;
}

function isManualResult(result: FlightSearchResult | null) {
  if (!result) {
    return false;
  }

  return (
    result.data.dataSource === "MANUAL" ||
    !result.data.departureAirportCode ||
    !result.data.arrivalAirportCode ||
    result.data.delayMinutes === null
  );
}

function isLikelyEligible(result: FlightSearchResult | null) {
  if (!result || isManualResult(result)) {
    return false;
  }

  return (
    result.data.flightStatus === "CANCELLED" ||
    (result.data.delayMinutes ?? 0) >= 180
  );
}

function buildFormUrl(input: {
  result: FlightSearchResult | null;
  passengers: number;
  flightNumber: string;
  flightDate: string;
  manual: ManualFlightData;
}) {
  const params = new URLSearchParams();
  const manualDelay = Number(input.manual.delayMinutes);
  const manualMode = isManualResult(input.result);

  params.set("passengers", String(input.passengers));

  if (!manualMode && input.result?.persistedFlightId) {
    params.set("flightId", input.result.persistedFlightId);
    return `/formularz?${params.toString()}`;
  }

  params.set("manual", "1");
  params.set(
    "flightNumber",
    input.result?.data.flightNumber ?? normalizeFlightNumber(input.flightNumber),
  );
  params.set("flightDate", input.result?.data.flightDate ?? input.flightDate);
  params.set(
    "departureAirportCode",
    input.result?.data.departureAirportCode || input.manual.departureAirportCode,
  );
  params.set(
    "arrivalAirportCode",
    input.result?.data.arrivalAirportCode || input.manual.arrivalAirportCode,
  );

  if (Number.isFinite(manualDelay)) {
    params.set("delayMinutes", String(manualDelay));
  } else if (input.result?.data.delayMinutes !== null) {
    params.set("delayMinutes", String(input.result?.data.delayMinutes));
  }

  return `/formularz?${params.toString()}`;
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
  const [searchError, setSearchError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<FlightSearchResult | null>(null);
  const utils = api.useUtils();
  const manualMode = isManualResult(result);
  const eligible = isLikelyEligible(result);
  const amountPerPassenger = estimateAmountPerPassenger(result);
  const totalAmount = amountPerPassenger * passengers;
  const formUrl = buildFormUrl({
    result,
    passengers,
    flightNumber,
    flightDate,
    manual,
  });

  function validateStepOne() {
    const normalizedFlightNumber = normalizeFlightNumber(flightNumber);

    if (!flightNumberPattern.test(flightNumber.trim())) {
      return "Wpisz numer lotu, np. LO123 albo W6 789.";
    }

    if (!flightDate) {
      return "Wybierz datę lotu.";
    }

    if (flightDate < bounds.min || flightDate > bounds.max) {
      return "Data lotu musi być z przeszłości i maksymalnie 3 lata wstecz.";
    }

    if (normalizedFlightNumber.length < 3) {
      return "Numer lotu jest zbyt krótki.";
    }

    return null;
  }

  async function handleSubmit() {
    const error = validateStepOne();

    setFieldError(error);
    setSearchError(false);

    if (error) {
      return;
    }

    setIsChecking(true);

    try {
      const data = await utils.flights.search.fetch({
        flightNumber: normalizeFlightNumber(flightNumber),
        date: flightDate,
      });

      setResult(data as FlightSearchResult);
      setManual({
        departureAirportCode: data.data.departureAirportCode,
        arrivalAirportCode: data.data.arrivalAirportCode,
        delayMinutes:
          data.data.delayMinutes === null ? "" : String(data.data.delayMinutes),
      });
      setStep(2);
    } catch {
      setSearchError(true);
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
            <p className={styles.funnelError}>
              Nie możemy znaleźć danych tego lotu. Sprawdź numer i datę.
            </p>
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
                : eligible
                  ? styles.funnelResultGood
                  : styles.funnelResultMuted
            }`}
          >
            <h2>
              {manualMode
                ? "Uzupełnij dane ręcznie"
                : eligible
                  ? "Lot może kwalifikować się do odszkodowania"
                  : "Ten lot może nie spełniać podstawowych warunków"}
            </h2>
            <p>
              {manualMode
                ? "Nie mamy pełnych danych tego lotu, ale możesz przejść dalej i dopisać brakujące informacje we wniosku."
                : eligible
                  ? "Opóźnienie lub status lotu wskazuje na możliwe roszczenie według WE 261/2004."
                  : "Wstępne dane wskazują na zbyt krótkie opóźnienie. Nadal możesz złożyć wniosek, jeśli masz dodatkowe informacje."}
            </p>
          </div>

          <dl className={styles.funnelSummary}>
            <div>
              <dt>Numer lotu</dt>
              <dd>{result.data.flightNumber}</dd>
            </div>
            <div>
              <dt>Trasa</dt>
              <dd>{formatRoute(result)}</dd>
            </div>
            <div>
              <dt>Opóźnienie</dt>
              <dd>
                {result.data.delayMinutes === null
                  ? "Do uzupełnienia"
                  : `${result.data.delayMinutes} min`}
              </dd>
            </div>
            <div>
              <dt>Odszkodowanie / pasażer</dt>
              <dd>{amountPerPassenger ? `${amountPerPassenger} EUR` : "Do oceny"}</dd>
            </div>
          </dl>

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
              Część danych wymaga potwierdzenia przez OWEME. To nie blokuje
              złożenia wniosku.
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
