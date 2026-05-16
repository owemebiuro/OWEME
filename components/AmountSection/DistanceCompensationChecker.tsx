"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AirportInput } from "@/components/FlightChecker/Landing/AirportInput";
import type { Airport } from "@/lib/flight-checker-data";

import styles from "./AmountSection.module.css";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: Airport, to: Airport) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function compensationForDistance(distance: number) {
  if (distance < 1500) {
    return {
      amount: 250,
      label: "do 1 500 km",
      note: "krótkie połączenia krajowe i europejskie",
    };
  }

  if (distance <= 3500) {
    return {
      amount: 400,
      label: "1 500-3 500 km",
      note: "średnie trasy europejskie i kontynentalne",
    };
  }

  return {
    amount: 600,
    label: "3 500 km lub więcej",
    note: "loty długodystansowe",
  };
}

export function DistanceCompensationChecker() {
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);

  const result = useMemo(() => {
    if (!from || !to || from.iata === to.iata) {
      return null;
    }

    const distance = Math.round(distanceKm(from, to));
    const compensation = compensationForDistance(distance);
    const progress = Math.min(100, Math.max(8, (distance / 5200) * 100));

    return { distance, compensation, progress };
  }, [from, to]);

  const routeUrl =
    from && to && from.iata !== to.iata
      ? `/claim/check?${new URLSearchParams({ from: from.iata, to: to.iata }).toString()}`
      : "/claim";

  return (
    <div className={styles.distanceCard}>
      <div className={styles.distanceFields}>
        <AirportInput
          label="Lotnisko startowe"
          placeholder="WAW"
          value={from}
          onChange={setFrom}
          variant="prominent"
        />
        <AirportInput
          label="Lotnisko przylotu"
          placeholder="LAX"
          value={to}
          onChange={setTo}
          variant="prominent"
        />
      </div>

      <div className={styles.distanceResult}>
        <div>
          <span className={styles.distanceEyebrow}>Szacowana kwota</span>
          <strong className={styles.distanceAmount}>
            {result ? `€${result.compensation.amount}` : "€250-€600"}
          </strong>
          <p>
            {result
              ? `${result.distance.toLocaleString("pl-PL")} km · ${result.compensation.label}`
              : "Wybierz lotniska, a policzymy dystans i próg odszkodowania."}
          </p>
        </div>
        <Link className={styles.distanceCta} href={routeUrl}>
          Kontynuuj sprawdzenie
        </Link>
      </div>

      <div className={styles.distanceRail} aria-hidden="true">
        <div className={styles.distanceGradient} />
        <div
          className={styles.distancePlane}
          style={{ left: `${result?.progress ?? 66}%` }}
        >
          <span>✈</span>
        </div>
      </div>

      <div className={styles.distanceScale}>
        <span>1 500 km</span>
        <span>3 500 km</span>
        <span>więcej</span>
      </div>

      {from && to && from.iata === to.iata ? (
        <p className={styles.distanceError}>
          Wybierz dwa różne lotniska, żeby policzyć trasę.
        </p>
      ) : (
        <p className={styles.distanceHint}>
          Kwota wynika z dystansu lotu według progów EC 261/2004. Ostateczna
          kwalifikacja zależy też od rodzaju zakłócenia i przyczyny opóźnienia.
        </p>
      )}
    </div>
  );
}
