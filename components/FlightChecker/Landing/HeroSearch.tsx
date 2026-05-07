"use client";

import axios from "axios";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { Airport } from "@/lib/flight-checker-data";

import { AirportInput } from "./AirportInput";
import styles from "./Landing.module.css";

interface BoardingPassResponse {
  from?: string;
  to?: string;
  date?: string;
  flightDate?: string;
  airline?: string;
  flightNumber?: string;
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8h8.25m0 0L8.4 4.65M11.75 8 8.4 11.35"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 12.5V3.75m0 0L4.95 6.8M8 3.75l3.05 3.05M3 12.5h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildCheckerUrl(data: BoardingPassResponse) {
  if (!data.from || !data.to) {
    return null;
  }

  const params = new URLSearchParams({ from: data.from, to: data.to });
  const date = data.date ?? data.flightDate;

  if (date) {
    params.set("date", date);
  }

  if (data.airline) {
    params.set("airline", data.airline);
  }

  if (data.flightNumber) {
    params.set("flightNumber", data.flightNumber);
  }

  return `/claim/check?${params.toString()}`;
}

export function HeroSearch() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  function goToChecker(nextFrom = from?.iata, nextTo = to?.iata) {
    if (!nextFrom || !nextTo) {
      setError("Wybierz lotnisko wylotu i lotnisko docelowe.");
      return;
    }

    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    router.push(`/claim/check?${params.toString()}`);
  }

  async function handleBoardingPass(file: File | undefined) {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsParsing(true);
    setError(null);

    try {
      const response = await axios.post<BoardingPassResponse>(
        "/api/boarding-pass/parse",
        formData,
      );
      const checkerUrl = buildCheckerUrl(response.data);

      if (!checkerUrl) {
        setError("Nie udało się odczytać trasy z karty pokładowej.");
        return;
      }

      router.push(checkerUrl);
    } catch {
      setError("Nie udało się przetworzyć karty pokładowej.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <div className={styles.search}>
        <AirportInput
          label="Lotnisko wylotu"
          placeholder="Lotnisko wylotu"
          value={from}
          onChange={(airport) => {
            setFrom(airport);
            setError(null);
          }}
        />
        <span className={styles.divider} aria-hidden="true" />
        <AirportInput
          label="Lotnisko docelowe"
          placeholder="Lotnisko docelowe"
          value={to}
          onChange={(airport) => {
            setTo(airport);
            setError(null);
          }}
        />
        <button
          type="button"
          className={styles.submit}
          disabled={!from || !to}
          onClick={() => goToChecker()}
        >
          <span>Sprawdź odszkodowanie</span>
          <ArrowRightIcon />
        </button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.boarding}>
        <span>lub sprawdź szybko przez</span>
        <button
          type="button"
          className={styles.boardingButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
        >
          <UploadIcon />
          <span>{isParsing ? "Czytamy kartę..." : "Kartę pokładową"}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf,.jpg,.jpeg,.png,.pkpass"
          onChange={(event) => handleBoardingPass(event.target.files?.[0])}
        />
      </div>
    </>
  );
}
