import "server-only";

import {
  ApiDataSource,
  FlightStatus,
  Prisma,
  type Flight,
} from "@prisma/client";

import type {
  FlightAwareFlightsResponse,
  FlightDataLookupResult,
  FlightLookupFlight,
  FlightResultDataSource,
  NormalizedFlightData,
} from "@/lib/flightaware/aeroapi.types";
import {
  fetchFlightAwareFlights,
  getFlightAwareConfigurationStatus,
} from "@/lib/flightaware/aeroapi.client";
import { mapFlightAwareResponse } from "@/lib/flightaware/aeroapi.mapper";
import {
  FlightAwareAeroApiConfigurationError,
  FlightAwareAeroApiError,
  FlightAwareAeroApiNotFoundError,
} from "@/lib/flightaware/aeroapi.types";
import {
  buildEligibilityResult,
  calculateAmountCategoryFromDistance,
  calculateDelayMinutes,
} from "@/lib/flightaware/flight-eligibility";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";

type FetchFlightOptions = {
  forceRefresh?: boolean;
  cacheTtlHours?: number;
};

type CachedFlightRecord = Flight & {
  airline: {
    iataCode: string;
    name: string;
  };
};

export type FlightApiData = NormalizedFlightData;
export type FlightApiResult = FlightDataLookupResult;

export class FlightApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlightApiError";
  }
}

export class FlightNotFoundError extends FlightApiError {
  constructor(message = "Nie znaleziono lotu u providera danych lotniczych.") {
    super(message);
    this.name = "FlightNotFoundError";
  }
}

function normalizeFlightNumber(flightNumber: string) {
  return flightNumber.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeFlightDate(date: string) {
  return date.trim().slice(0, 10);
}

function dateFromFlightDate(date: string) {
  return new Date(`${normalizeFlightDate(date)}T00:00:00.000Z`);
}

function formatDateTime(value: Date | null) {
  return value ? value.toISOString() : null;
}

function getConfiguredCacheTtlHours() {
  const parsed = Number(process.env.FLIGHT_DATA_CACHE_TTL_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6;
}

function buildConfigurationErrorMessage() {
  const configuration = getFlightAwareConfigurationStatus();

  if (process.env.NODE_ENV === "production") {
    return "Nie udało się pobrać danych lotu. Integracja lotnicza nie jest jeszcze skonfigurowana.";
  }

  const missingPart =
    configuration.missingEnv.length > 0
      ? ` Brakuje: ${configuration.missingEnv.join(", ")}.`
      : "";

  return `Nie udało się pobrać danych lotu. Integracja lotnicza nie jest jeszcze skonfigurowana.${missingPart} Dodaj brakujące wartości do .env.local i zrestartuj npm run dev.`;
}

function getCacheTtlMs(cacheTtlHours?: number) {
  const hours = cacheTtlHours ?? getConfiguredCacheTtlHours();
  return hours * 60 * 60 * 1000;
}

function airlineIataFromFlightNumber(flightNumber: string) {
  return normalizeFlightNumber(flightNumber).slice(0, 2) || "XX";
}

function mapDataSource(dataSource: ApiDataSource): FlightResultDataSource {
  if (dataSource === ApiDataSource.CACHE) {
    return "CACHE";
  }

  if (dataSource === ApiDataSource.MANUAL) {
    return "MANUAL";
  }

  return "AEROAPI";
}

function isFlightAwareResponse(
  value: unknown,
): value is FlightAwareFlightsResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "flights" in (value as Record<string, unknown>),
  );
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function createLookupFlight(
  data: NormalizedFlightData,
  options?: {
    id?: string | null;
    sourceOverride?: FlightResultDataSource;
  },
): FlightLookupFlight {
  return {
    id: options?.id ?? undefined,
    flightNumber: data.flightNumber,
    flightDate: data.flightDate,
    airlineName: data.airlineName,
    airlineIata: data.airlineIata,
    departureAirportCode: data.departureAirportCode,
    departureAirportName: data.departureAirportName,
    arrivalAirportCode: data.arrivalAirportCode,
    arrivalAirportName: data.arrivalAirportName,
    scheduledDeparture: formatDateTime(data.scheduledDeparture),
    actualDeparture: formatDateTime(data.actualDeparture),
    scheduledArrival: formatDateTime(data.scheduledArrival),
    actualArrival: formatDateTime(data.actualArrival),
    distanceKm: data.distanceKm,
    delayMinutes: data.delayMinutes,
    flightStatus: data.flightStatus,
    dataSource: options?.sourceOverride ?? mapDataSource(data.dataSource),
  };
}

function buildLookupResult(input: {
  found: boolean;
  data: NormalizedFlightData | null;
  warnings?: string[];
  error?: string;
  persistedFlightId?: string | null;
  cacheHit?: boolean;
  sourceOverride?: FlightResultDataSource;
}): FlightApiResult {
  const warnings = input.warnings ?? [];
  const flight =
    input.found && input.data
      ? createLookupFlight(input.data, {
          id: input.persistedFlightId,
          sourceOverride: input.sourceOverride,
        })
      : null;

  return {
    found: input.found,
    flight,
    compensation: buildEligibilityResult({
      found: input.found,
      distanceKm: input.data?.distanceKm ?? null,
      delayMinutes: input.data?.delayMinutes ?? null,
      flightStatus: input.data?.flightStatus ?? null,
      departureAirportCode: input.data?.departureAirportCode ?? null,
      arrivalAirportCode: input.data?.arrivalAirportCode ?? null,
      error: input.error,
    }),
    error: input.error,
    warnings,
    cacheHit: input.cacheHit ?? false,
    persistedFlightId: input.persistedFlightId ?? null,
  };
}

function getMockFlightData(
  flightNumber: string,
  date: string,
): NormalizedFlightData | null {
  const normalizedFlightNumber = normalizeFlightNumber(flightNumber);
  const normalizedDate = normalizeFlightDate(date);

  const catalog: Record<string, Omit<NormalizedFlightData, "flightNumber" | "flightDate" | "rawResponse" | "externalApiId" | "dataSource">> =
    {
      LO123: {
        airlineName: "LOT Polish Airlines",
        airlineIata: "LO",
        departureAirportCode: "WAW",
        departureAirportName: "Warsaw Chopin Airport",
        departureLatitude: 52.1657,
        departureLongitude: 20.9671,
        arrivalAirportCode: "LHR",
        arrivalAirportName: "London Heathrow Airport",
        arrivalLatitude: 51.47,
        arrivalLongitude: -0.4543,
        scheduledDeparture: new Date(`${normalizedDate}T10:00:00.000Z`),
        actualDeparture: new Date(`${normalizedDate}T10:20:00.000Z`),
        scheduledArrival: new Date(`${normalizedDate}T12:20:00.000Z`),
        actualArrival: new Date(`${normalizedDate}T13:10:00.000Z`),
        distanceKm: 1450,
        delayMinutes: 50,
        flightStatus: FlightStatus.LANDED,
        amountCategory: calculateAmountCategoryFromDistance(1450),
      },
      FR456: {
        airlineName: "Ryanair",
        airlineIata: "FR",
        departureAirportCode: "KTW",
        departureAirportName: "Katowice Airport",
        departureLatitude: 50.4743,
        departureLongitude: 19.08,
        arrivalAirportCode: "BCN",
        arrivalAirportName: "Barcelona El Prat Airport",
        arrivalLatitude: 41.2974,
        arrivalLongitude: 2.0833,
        scheduledDeparture: new Date(`${normalizedDate}T08:00:00.000Z`),
        actualDeparture: new Date(`${normalizedDate}T08:15:00.000Z`),
        scheduledArrival: new Date(`${normalizedDate}T11:00:00.000Z`),
        actualArrival: new Date(`${normalizedDate}T14:40:00.000Z`),
        distanceKm: 1675,
        delayMinutes: 220,
        flightStatus: FlightStatus.LANDED,
        amountCategory: calculateAmountCategoryFromDistance(1675),
      },
      EK204: {
        airlineName: "Emirates",
        airlineIata: "EK",
        departureAirportCode: "JFK",
        departureAirportName: "John F. Kennedy International Airport",
        departureLatitude: 40.6413,
        departureLongitude: -73.7781,
        arrivalAirportCode: "DXB",
        arrivalAirportName: "Dubai International Airport",
        arrivalLatitude: 25.2532,
        arrivalLongitude: 55.3657,
        scheduledDeparture: new Date(`${normalizedDate}T22:00:00.000Z`),
        actualDeparture: new Date(`${normalizedDate}T22:35:00.000Z`),
        scheduledArrival: new Date(`${normalizedDate}T09:00:00.000Z`),
        actualArrival: new Date(`${normalizedDate}T11:55:00.000Z`),
        distanceKm: 11020,
        delayMinutes: 175,
        flightStatus: FlightStatus.LANDED,
        amountCategory: calculateAmountCategoryFromDistance(11020),
      },
    };

  const match = catalog[normalizedFlightNumber];

  if (!match) {
    return null;
  }

  return {
    flightNumber: normalizedFlightNumber,
    flightDate: normalizedDate,
    ...match,
    dataSource: ApiDataSource.MANUAL,
    rawResponse: {
      mock: true,
      provider: "flightaware",
      flightNumber: normalizedFlightNumber,
    },
    externalApiId: `mock-${normalizedFlightNumber.toLowerCase()}`,
  };
}

function mergeStoredAndMappedFlightData(
  flight: CachedFlightRecord,
  mapped: NormalizedFlightData | null,
): NormalizedFlightData {
  const flightDate = flight.flightDate.toISOString().slice(0, 10);
  const delayMinutes = calculateDelayMinutes(
    flight.scheduledArrival,
    flight.actualArrival,
    flight.delayMinutes,
  );
  const distanceKm = flight.distanceKm ?? mapped?.distanceKm ?? null;

  return {
    flightNumber: flight.flightNumber,
    flightDate,
    airlineName: mapped?.airlineName ?? flight.airline.name,
    airlineIata: mapped?.airlineIata ?? flight.airline.iataCode,
    departureAirportCode: flight.departureAirportCode || mapped?.departureAirportCode || null,
    departureAirportName: mapped?.departureAirportName ?? null,
    departureLatitude: mapped?.departureLatitude ?? null,
    departureLongitude: mapped?.departureLongitude ?? null,
    arrivalAirportCode: flight.arrivalAirportCode || mapped?.arrivalAirportCode || null,
    arrivalAirportName: mapped?.arrivalAirportName ?? null,
    arrivalLatitude: mapped?.arrivalLatitude ?? null,
    arrivalLongitude: mapped?.arrivalLongitude ?? null,
    scheduledDeparture: flight.scheduledDeparture ?? mapped?.scheduledDeparture ?? null,
    actualDeparture: flight.actualDeparture ?? mapped?.actualDeparture ?? null,
    scheduledArrival: flight.scheduledArrival ?? mapped?.scheduledArrival ?? null,
    actualArrival: flight.actualArrival ?? mapped?.actualArrival ?? null,
    distanceKm,
    delayMinutes,
    flightStatus: flight.flightStatus,
    dataSource: ApiDataSource.CACHE,
    rawResponse: flight.rawApiResponse,
    externalApiId: flight.externalApiId,
    amountCategory:
      flight.amountCategory ??
      mapped?.amountCategory ??
      calculateAmountCategoryFromDistance(distanceKm),
  };
}

function flightToApiData(flight: CachedFlightRecord): NormalizedFlightData {
  let mappedFromRaw: NormalizedFlightData | null = null;

  if (isFlightAwareResponse(flight.rawApiResponse)) {
    try {
      mappedFromRaw = mapFlightAwareResponse(
        flight.rawApiResponse,
        flight.flightNumber,
        flight.flightDate.toISOString().slice(0, 10),
      );
    } catch {
      mappedFromRaw = null;
    }
  }

  return mergeStoredAndMappedFlightData(flight, mappedFromRaw);
}

async function getCachedFlight(
  flightNumber: string,
  date: string,
  cacheTtlMs: number,
) {
  if (!hasPrismaDatabaseUrl()) {
    return null;
  }

  const cachedFlight = await prisma.flight.findUnique({
    where: {
      flightNumber_flightDate: {
        flightNumber: normalizeFlightNumber(flightNumber),
        flightDate: dateFromFlightDate(date),
      },
    },
    include: {
      airline: {
        select: {
          iataCode: true,
          name: true,
        },
      },
    },
  });

  if (!cachedFlight) {
    return null;
  }

  const isFresh =
    cachedFlight.lastApiRefreshAt !== null &&
    Date.now() - cachedFlight.lastApiRefreshAt.getTime() < cacheTtlMs;

  return {
    cachedFlight,
    isFresh,
  };
}

async function persistFlightData(data: NormalizedFlightData) {
  if (!hasPrismaDatabaseUrl()) {
    return null;
  }

  const airline = await prisma.airline.upsert({
    where: {
      iataCode: data.airlineIata ?? airlineIataFromFlightNumber(data.flightNumber),
    },
    update: {
      name: data.airlineName ?? "Nieznana linia",
    },
    create: {
      iataCode: data.airlineIata ?? airlineIataFromFlightNumber(data.flightNumber),
      name: data.airlineName ?? "Nieznana linia",
    },
  });

  const delayMinutes = calculateDelayMinutes(
    data.scheduledArrival,
    data.actualArrival,
    data.delayMinutes,
  );
  const amountCategory =
    data.distanceKm !== null
      ? calculateAmountCategoryFromDistance(data.distanceKm)
      : null;

  const flight = await prisma.flight.upsert({
    where: {
      flightNumber_flightDate: {
        flightNumber: normalizeFlightNumber(data.flightNumber),
        flightDate: dateFromFlightDate(data.flightDate),
      },
    },
    update: {
      departureAirportCode: data.departureAirportCode ?? "",
      arrivalAirportCode: data.arrivalAirportCode ?? "",
      scheduledDeparture: data.scheduledDeparture,
      actualDeparture: data.actualDeparture,
      scheduledArrival: data.scheduledArrival,
      actualArrival: data.actualArrival,
      distanceKm: data.distanceKm,
      delayMinutes,
      flightStatus: data.flightStatus,
      amountCategory,
      dataSource: data.dataSource,
      externalApiId: data.externalApiId,
      rawApiResponse: toJsonValue(data.rawResponse),
      lastApiRefreshAt: new Date(),
      airlineId: airline.id,
    },
    create: {
      flightNumber: normalizeFlightNumber(data.flightNumber),
      flightDate: dateFromFlightDate(data.flightDate),
      departureAirportCode: data.departureAirportCode ?? "",
      arrivalAirportCode: data.arrivalAirportCode ?? "",
      scheduledDeparture: data.scheduledDeparture,
      actualDeparture: data.actualDeparture,
      scheduledArrival: data.scheduledArrival,
      actualArrival: data.actualArrival,
      distanceKm: data.distanceKm,
      delayMinutes,
      flightStatus: data.flightStatus,
      amountCategory,
      dataSource: data.dataSource,
      externalApiId: data.externalApiId,
      rawApiResponse: toJsonValue(data.rawResponse),
      lastApiRefreshAt: new Date(),
      airlineId: airline.id,
    },
    select: {
      id: true,
    },
  });

  return flight.id;
}

async function fetchFromFlightAware(
  flightNumber: string,
  date: string,
): Promise<NormalizedFlightData> {
  const response = await fetchFlightAwareFlights(flightNumber, date);
  return mapFlightAwareResponse(response, flightNumber, date);
}

export async function fetchFlightData(
  flightNumber: string,
  date: string,
  options: FetchFlightOptions = {},
): Promise<FlightApiResult> {
  const normalizedFlightNumber = normalizeFlightNumber(flightNumber);
  const normalizedDate = normalizeFlightDate(date);
  const cacheTtlMs = getCacheTtlMs(options.cacheTtlHours);
  const warnings: string[] = [];
  const cacheEntry = await getCachedFlight(
    normalizedFlightNumber,
    normalizedDate,
    cacheTtlMs,
  );

  if (cacheEntry?.isFresh && !options.forceRefresh) {
    const data = flightToApiData(cacheEntry.cachedFlight);
    return buildLookupResult({
      found: true,
      data,
      warnings,
      cacheHit: true,
      persistedFlightId: cacheEntry.cachedFlight.id,
      sourceOverride: "CACHE",
    });
  }

  if (process.env.USE_FLIGHT_API_MOCK === "true") {
    const data = getMockFlightData(normalizedFlightNumber, normalizedDate);

    if (!data) {
      return buildLookupResult({
        found: false,
        data: null,
        warnings,
        error:
          "Nie znaleźliśmy lotu o podanym numerze i dacie. Sprawdź numer lotu albo wybierz ręczne uzupełnienie danych.",
      });
    }

    const persistedFlightId = await persistFlightData(data);
    return buildLookupResult({
      found: true,
      data,
      warnings: ["Użyto mocka integracji FlightAware AeroAPI."],
      persistedFlightId,
      cacheHit: false,
      sourceOverride: "AEROAPI",
    });
  }

  try {
    const data = await fetchFromFlightAware(normalizedFlightNumber, normalizedDate);
    const persistedFlightId = await persistFlightData(data);

    return buildLookupResult({
      found: true,
      data: {
        ...data,
        delayMinutes: calculateDelayMinutes(
          data.scheduledArrival,
          data.actualArrival,
          data.delayMinutes,
        ),
      },
      warnings,
      cacheHit: false,
      persistedFlightId,
      sourceOverride: "AEROAPI",
    });
  } catch (error) {
    if (cacheEntry?.cachedFlight) {
      const cachedData = flightToApiData(cacheEntry.cachedFlight);
      const warningMessage =
        error instanceof Error
          ? error.message
          : "Odświeżenie z AeroAPI nie powiodło się.";

      return buildLookupResult({
        found: true,
        data: cachedData,
        warnings: [
          warningMessage,
          "Zwracamy ostatnie zapisane dane z cache.",
        ],
        cacheHit: true,
        persistedFlightId: cacheEntry.cachedFlight.id,
        sourceOverride: "CACHE",
      });
    }

    if (error instanceof FlightAwareAeroApiNotFoundError) {
      return buildLookupResult({
        found: false,
        data: null,
        warnings,
        error:
          "Nie znaleźliśmy lotu o podanym numerze i dacie. Sprawdź numer lotu albo wybierz ręczne uzupełnienie danych.",
      });
    }

    if (error instanceof FlightAwareAeroApiConfigurationError) {
      return buildLookupResult({
        found: false,
        data: null,
        warnings,
        error: buildConfigurationErrorMessage(),
      });
    }

    if (error instanceof FlightAwareAeroApiError) {
      return buildLookupResult({
        found: false,
        data: null,
        warnings,
        error:
          "Nie udało się pobrać danych lotu. Spróbuj ponownie albo wybierz ręczne uzupełnienie danych.",
      });
    }

    return buildLookupResult({
      found: false,
      data: null,
      warnings,
      error:
        "Wystąpił problem podczas sprawdzania lotu. Spróbuj ponownie albo wybierz ręczne uzupełnienie danych.",
    });
  }
}

export async function fetchFromAviationStack(
  flightNumber: string,
  date: string,
) {
  const result = await fetchFlightData(flightNumber, date);

  if (!result.found || !result.flight) {
    throw new FlightNotFoundError(result.error);
  }

  return result;
}

export async function fetchFromAeroDataBox(
  flightNumber: string,
  date: string,
) {
  const result = await fetchFlightData(flightNumber, date);

  if (!result.found || !result.flight) {
    throw new FlightNotFoundError(result.error);
  }

  return result;
}
