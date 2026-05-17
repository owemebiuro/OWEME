import type { Airport } from "@/lib/flight-checker-data";

export const TIERS = [
  { threshold: 33, maxKm: 1500, label: "do 1 500 km", amt: 250 },
  { threshold: 67, maxKm: 3500, label: "1 500 - 3 500 km", amt: 400 },
  { threshold: 100, maxKm: 99999, label: "powyżej 3 500 km", amt: 600 },
] as const;

export type Tier = (typeof TIERS)[number];
export type HintState = "idle" | "qualified" | "no-data";

function normalizeAirportCode(value: string) {
  return value.trim().toUpperCase();
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function hasCoordinates(airport: Airport | null): airport is Airport {
  return Boolean(
    airport &&
      Number.isFinite(airport.lat) &&
      Number.isFinite(airport.lon),
  );
}

export function getDistance(
  fromAirport: Airport | null,
  toAirport: Airport | null,
): number | null {
  if (
    !hasCoordinates(fromAirport) ||
    !hasCoordinates(toAirport) ||
    fromAirport.iata === toAirport.iata
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toAirport.lat - fromAirport.lat);
  const deltaLon = toRadians(toAirport.lon - fromAirport.lon);
  const fromLat = toRadians(fromAirport.lat);
  const toLat = toRadians(toAirport.lat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2;

  return Math.round(
    earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
  );
}

export function tierFromSlider(value: number): Tier {
  return TIERS.find((tier) => value <= tier.threshold) ?? TIERS[2];
}

export function tierFromKm(km: number): Tier {
  return TIERS.find((tier) => km <= tier.maxKm) ?? TIERS[2];
}

export function kmToSlider(km: number): number {
  if (km <= 1500) return Math.round((km / 1500) * 33);
  if (km <= 3500) return Math.round(33 + ((km - 1500) / 2000) * 34);

  return Math.round(67 + Math.min(((km - 3500) / 6500) * 33, 33));
}

export function computeHint(
  from: string,
  to: string,
  fromAirport: Airport | null,
  toAirport: Airport | null,
) {
  const normalizedFrom = normalizeAirportCode(from);
  const normalizedTo = normalizeAirportCode(to);

  if (normalizedFrom.length < 3 || normalizedTo.length < 3) {
    return {
      state: "idle" as const,
      text: "Wpisz lotniska, a przeliczymy dystans i próg odszkodowania.",
    };
  }

  if (normalizedFrom === normalizedTo) {
    return {
      state: "no-data" as const,
      text: "Wybierz dwa różne lotniska, żeby policzyć trasę.",
    };
  }

  const distance = getDistance(fromAirport, toAirport);

  if (distance === null) {
    return {
      state: "no-data" as const,
      text: "Wybierz lotniska z listy lub wpisz poprawne kody IATA, a przeliczymy dystans.",
    };
  }

  const tier = tierFromKm(distance);

  return {
    state: "qualified" as const,
    text: `${from} - ${to}: ${distance.toLocaleString("pl-PL")} km. Próg: ${tier.label}.`,
  };
}
