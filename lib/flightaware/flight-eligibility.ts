import { ClaimAmountCategory, FlightStatus } from "@prisma/client";

import type { FlightCompensationResult } from "@/lib/flightaware/aeroapi.types";

type CoordinatePoint = {
  latitude: number | null;
  longitude: number | null;
};

export function calculateDelayMinutes(
  scheduledArrival: Date | null,
  actualArrival: Date | null,
  providerDelayMinutes: number | null,
) {
  if (providerDelayMinutes !== null && Number.isFinite(providerDelayMinutes)) {
    return Math.max(0, Math.round(providerDelayMinutes));
  }

  if (!scheduledArrival || !actualArrival) {
    return null;
  }

  const difference = Math.round(
    (actualArrival.getTime() - scheduledArrival.getTime()) / 60000,
  );

  return Math.max(0, difference);
}

export function calculateDistanceKm(
  departure: CoordinatePoint,
  arrival: CoordinatePoint,
) {
  if (
    departure.latitude === null ||
    departure.longitude === null ||
    arrival.latitude === null ||
    arrival.longitude === null
  ) {
    return null;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(arrival.latitude - departure.latitude);
  const dLon = toRadians(arrival.longitude - departure.longitude);
  const lat1 = toRadians(departure.latitude);
  const lat2 = toRadians(arrival.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusKm * c);
}

export function calculateCompensationByDistance(
  distanceKm: number | null,
): Omit<FlightCompensationResult, "reason"> {
  if (!distanceKm || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    return {
      amountEur: null,
      category: null,
    };
  }

  if (distanceKm <= 1500) {
    return {
      amountEur: 250,
      category: ClaimAmountCategory.EUR_250,
    };
  }

  if (distanceKm <= 3500) {
    return {
      amountEur: 400,
      category: ClaimAmountCategory.EUR_400,
    };
  }

  return {
    amountEur: 600,
    category: ClaimAmountCategory.EUR_600,
  };
}

export function calculateAmountCategoryFromDistance(
  distanceKm: number | null,
) {
  return calculateCompensationByDistance(distanceKm).category;
}

export function amountFromCategory(
  category: ClaimAmountCategory | null | undefined,
) {
  if (category === ClaimAmountCategory.EUR_250) {
    return 250;
  }

  if (category === ClaimAmountCategory.EUR_400) {
    return 400;
  }

  if (category === ClaimAmountCategory.EUR_600) {
    return 600;
  }

  return null;
}

export function buildEligibilityResult(input: {
  found: boolean;
  distanceKm: number | null;
  delayMinutes: number | null;
  flightStatus: FlightStatus | null;
  error?: string;
}): FlightCompensationResult {
  if (!input.found) {
    return {
      amountEur: null,
      category: null,
      reason:
        input.error ??
        "Nie znaleźliśmy lotu o podanym numerze i dacie. Sprawdź numer lotu albo wybierz ręczne uzupełnienie danych.",
    };
  }

  const byDistance = calculateCompensationByDistance(input.distanceKm);

  if (byDistance.amountEur === null) {
    return {
      amountEur: null,
      category: null,
      reason:
        "Nie możemy automatycznie wyliczyć kwoty, ale możesz złożyć wniosek do ręcznej weryfikacji.",
    };
  }

  const qualifier =
    input.flightStatus === FlightStatus.CANCELLED
      ? "Lot jest oznaczony jako odwołany."
      : input.delayMinutes !== null
        ? `Wstępnie wykryte opóźnienie: ${input.delayMinutes} min.`
        : "Brakuje pełnych danych o opóźnieniu.";

  return {
    amountEur: byDistance.amountEur,
    category: byDistance.category,
    reason: `Szacunkowa kwota dla tej trasy to ${byDistance.amountEur} EUR. ${qualifier} Ostateczna kwalifikacja wymaga jeszcze potwierdzenia.`,
  };
}

export function isLikelyEligibleFlight(input: {
  delayMinutes: number | null;
  flightStatus: FlightStatus;
}) {
  return (
    input.flightStatus === FlightStatus.CANCELLED ||
    (input.delayMinutes ?? 0) >= 180
  );
}
