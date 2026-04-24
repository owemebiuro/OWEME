import { FlightStatus } from "@prisma/client";

import {
  FLIGHTAWARE_DATA_SOURCE,
  FlightAwareAeroApiMappingError,
  type FlightAwareAirport,
  type FlightAwareFlightRecord,
  type FlightAwareFlightsResponse,
  type NormalizedFlightData,
} from "@/lib/flightaware/aeroapi.types";
import {
  calculateAmountCategoryFromDistance,
  calculateDelayMinutes,
  calculateDistanceKm,
} from "@/lib/flightaware/flight-eligibility";

function normalizeFlightNumber(flightNumber: string) {
  return flightNumber.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeFlightDate(date: string) {
  return date.trim().slice(0, 10);
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAirportCode(airport: FlightAwareAirport | null | undefined) {
  const code = airport?.code_iata ?? airport?.iata ?? airport?.code ?? null;
  return code?.trim().toUpperCase() || null;
}

function getAirportName(airport: FlightAwareAirport | null | undefined) {
  return airport?.name?.trim() || airport?.airport_name?.trim() || null;
}

function getAirportCoordinate(
  airport: FlightAwareAirport | null | undefined,
  axis: "latitude" | "longitude",
) {
  const direct =
    axis === "latitude"
      ? airport?.latitude ?? airport?.lat
      : airport?.longitude ?? airport?.lon;
  const nested =
    axis === "latitude"
      ? airport?.position?.latitude ?? airport?.position?.lat
      : airport?.position?.longitude ?? airport?.position?.lon;
  const value = direct ?? nested ?? null;

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getAirlineName(record: FlightAwareFlightRecord) {
  if (typeof record.operator === "object" && record.operator) {
    return (
      record.operator.name?.trim() ||
      record.operator.shortname?.trim() ||
      null
    );
  }

  if (typeof record.operator === "string" && record.operator.trim()) {
    return record.operator.trim();
  }

  return record.operator_name?.trim() || null;
}

function getAirlineIata(
  record: FlightAwareFlightRecord,
  fallbackFlightNumber: string,
) {
  const fromOperator =
    typeof record.operator === "object" && record.operator
      ? record.operator.iata?.trim().toUpperCase() || null
      : null;

  if (fromOperator) {
    return fromOperator;
  }

  if (record.operator_iata?.trim()) {
    return record.operator_iata.trim().toUpperCase();
  }

  return fallbackFlightNumber.slice(0, 2) || null;
}

function mapFlightStatus(record: FlightAwareFlightRecord): FlightStatus {
  if (record.cancelled) {
    return FlightStatus.CANCELLED;
  }

  if (record.diverted) {
    return FlightStatus.DIVERTED;
  }

  const status = record.status?.toLowerCase() ?? "";

  if (status.includes("cancel")) {
    return FlightStatus.CANCELLED;
  }

  if (
    status.includes("land") ||
    status.includes("arriv") ||
    status.includes("complete")
  ) {
    return FlightStatus.LANDED;
  }

  if (
    status.includes("active") ||
    status.includes("en route") ||
    status.includes("enroute")
  ) {
    return FlightStatus.ACTIVE;
  }

  if (status.includes("divert")) {
    return FlightStatus.DIVERTED;
  }

  if (status.includes("sched")) {
    return FlightStatus.SCHEDULED;
  }

  return FlightStatus.UNKNOWN;
}

function scoreFlightRecord(
  record: FlightAwareFlightRecord,
  requestedFlightNumber: string,
  requestedFlightDate: string,
) {
  let score = 0;
  const requestedNumber = normalizeFlightNumber(requestedFlightNumber);
  const requestedDate = normalizeFlightDate(requestedFlightDate);
  const ident = normalizeFlightNumber(
    record.ident_iata ?? record.ident ?? requestedNumber,
  );
  const recordDate = (
    parseDate(record.scheduled_out) ??
    parseDate(record.actual_out) ??
    parseDate(record.scheduled_in) ??
    parseDate(record.actual_in)
  )
    ?.toISOString()
    .slice(0, 10);

  if (ident === requestedNumber) {
    score += 10;
  }

  if (recordDate === requestedDate) {
    score += 15;
  }

  if (record.actual_in || record.actual_out) {
    score += 3;
  }

  if (record.scheduled_in || record.scheduled_out) {
    score += 2;
  }

  if (record.origin || record.destination) {
    score += 1;
  }

  return score;
}

function getDistanceKm(record: FlightAwareFlightRecord) {
  const apiDistanceKm =
    record.route_distance_km ??
    record.distance_km ??
    null;

  if (
    typeof apiDistanceKm === "number" &&
    Number.isFinite(apiDistanceKm) &&
    apiDistanceKm > 0
  ) {
    return Math.round(apiDistanceKm);
  }

  if (
    typeof record.distance_nm === "number" &&
    Number.isFinite(record.distance_nm) &&
    record.distance_nm > 0
  ) {
    return Math.round(record.distance_nm * 1.852);
  }

  return calculateDistanceKm(
    {
      latitude: getAirportCoordinate(record.origin, "latitude"),
      longitude: getAirportCoordinate(record.origin, "longitude"),
    },
    {
      latitude: getAirportCoordinate(record.destination, "latitude"),
      longitude: getAirportCoordinate(record.destination, "longitude"),
    },
  );
}

export function mapFlightAwareResponse(
  response: FlightAwareFlightsResponse,
  requestedFlightNumber: string,
  requestedFlightDate: string,
): NormalizedFlightData {
  const records = response.flights ?? [];

  if (!records.length) {
    throw new FlightAwareAeroApiMappingError(
      "FlightAware AeroAPI nie zwróciło żadnych rekordów lotu.",
    );
  }

  const bestRecord = [...records].sort(
    (left, right) =>
      scoreFlightRecord(right, requestedFlightNumber, requestedFlightDate) -
      scoreFlightRecord(left, requestedFlightNumber, requestedFlightDate),
  )[0];

  const flightNumber = normalizeFlightNumber(
    bestRecord.ident_iata ?? bestRecord.ident ?? requestedFlightNumber,
  );
  const flightDate =
    (
      parseDate(bestRecord.scheduled_out) ??
      parseDate(bestRecord.actual_out) ??
      parseDate(bestRecord.scheduled_in) ??
      parseDate(bestRecord.actual_in)
    )
      ?.toISOString()
      .slice(0, 10) ?? normalizeFlightDate(requestedFlightDate);

  const scheduledDeparture = parseDate(bestRecord.scheduled_out);
  const actualDeparture = parseDate(bestRecord.actual_out);
  const scheduledArrival = parseDate(bestRecord.scheduled_in);
  const actualArrival = parseDate(bestRecord.actual_in);
  const distanceKm = getDistanceKm(bestRecord);

  return {
    flightNumber,
    flightDate,
    airlineName: getAirlineName(bestRecord),
    airlineIata: getAirlineIata(bestRecord, flightNumber),
    departureAirportCode: getAirportCode(bestRecord.origin),
    departureAirportName: getAirportName(bestRecord.origin),
    departureLatitude: getAirportCoordinate(bestRecord.origin, "latitude"),
    departureLongitude: getAirportCoordinate(bestRecord.origin, "longitude"),
    arrivalAirportCode: getAirportCode(bestRecord.destination),
    arrivalAirportName: getAirportName(bestRecord.destination),
    arrivalLatitude: getAirportCoordinate(bestRecord.destination, "latitude"),
    arrivalLongitude: getAirportCoordinate(bestRecord.destination, "longitude"),
    scheduledDeparture,
    actualDeparture,
    scheduledArrival,
    actualArrival,
    distanceKm,
    delayMinutes: calculateDelayMinutes(scheduledArrival, actualArrival, null),
    flightStatus: mapFlightStatus(bestRecord),
    dataSource: FLIGHTAWARE_DATA_SOURCE,
    rawResponse: response,
    externalApiId: bestRecord.fa_flight_id ?? null,
    amountCategory: calculateAmountCategoryFromDistance(distanceKm),
  };
}
