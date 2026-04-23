import {
  ApiDataSource,
  ClaimAmountCategory,
  FlightStatus,
  type Flight,
  type Prisma,
} from "@prisma/client";

import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";

export type FlightApiData = {
  flightNumber: string;
  flightDate: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  scheduledDeparture: Date | null;
  actualDeparture: Date | null;
  scheduledArrival: Date | null;
  actualArrival: Date | null;
  delayMinutes: number | null;
  flightStatus: FlightStatus;
  airlineIata: string;
  airlineName: string;
  dataSource: ApiDataSource;
  rawResponse: unknown;
};

export type FlightApiResult = {
  data: FlightApiData;
  warnings: string[];
  cacheHit: boolean;
  persistedFlightId: string | null;
};

type FetchFlightOptions = {
  forceRefresh?: boolean;
  cacheTtlMs?: number;
};

type ProviderName = "AviationStack" | "AeroDataBox";

const defaultCacheTtlMs = 1000 * 60 * 60 * 12;
const defaultTimeoutMs = 8000;

export class FlightApiError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderName,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "FlightApiError";
  }
}

export class FlightNotFoundError extends FlightApiError {
  constructor(provider: ProviderName) {
    super("Nie znaleziono lotu u providera.", provider);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPath(value: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
  }, value);
}

function readString(value: unknown, path: readonly string[]) {
  const result = readPath(value, path);

  return typeof result === "string" && result.trim() ? result.trim() : null;
}

function readNumber(value: unknown, path: readonly string[]) {
  const result = readPath(value, path);

  if (typeof result === "number" && Number.isFinite(result)) {
    return result;
  }

  if (typeof result === "string" && result.trim()) {
    const parsed = Number(result);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseApiDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateDelayMinutes(
  scheduledArrival: Date | null,
  actualArrival: Date | null,
  providerDelay: number | null,
) {
  if (providerDelay !== null) {
    return Math.round(providerDelay);
  }

  if (!scheduledArrival || !actualArrival) {
    return null;
  }

  return Math.max(
    0,
    Math.round((actualArrival.getTime() - scheduledArrival.getTime()) / 60000),
  );
}

function mapFlightStatus(value: string | null): FlightStatus {
  const normalized = value?.toLowerCase() ?? "";

  if (normalized.includes("cancel")) {
    return FlightStatus.CANCELLED;
  }

  if (normalized.includes("land") || normalized.includes("arrived")) {
    return FlightStatus.LANDED;
  }

  if (normalized.includes("active") || normalized.includes("en-route")) {
    return FlightStatus.ACTIVE;
  }

  if (normalized.includes("divert")) {
    return FlightStatus.DIVERTED;
  }

  if (normalized.includes("schedule")) {
    return FlightStatus.SCHEDULED;
  }

  return FlightStatus.UNKNOWN;
}

function airlineIataFromFlightNumber(flightNumber: string) {
  const match = normalizeFlightNumber(flightNumber).match(/^[A-Z]{2}/);

  return match?.[0] ?? "XX";
}

function calculateAmountCategory(): ClaimAmountCategory | null {
  // TODO: replace with real great-circle distance calculation once airport coordinates are available.
  return null;
}

async function fetchJson(
  url: string,
  init: RequestInit,
  provider: ProviderName,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), defaultTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new FlightApiError(
        `${provider} zwrócił błąd HTTP ${response.status}.`,
        provider,
        response.status,
      );
    }

    return response.json() as Promise<unknown>;
  } catch (error) {
    if (error instanceof FlightApiError) {
      throw error;
    }

    throw new FlightApiError(
      `${provider} jest chwilowo niedostępny.`,
      provider,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function pickFirstArrayItem(value: unknown) {
  return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

function mapAviationStackResponse(
  response: unknown,
  flightNumber: string,
  date: string,
): FlightApiData {
  const item = pickFirstArrayItem(readPath(response, ["data"]));

  if (!item) {
    throw new FlightNotFoundError("AviationStack");
  }

  const scheduledArrival = parseApiDate(
    readString(item, ["arrival", "scheduled"]),
  );
  const actualArrival = parseApiDate(readString(item, ["arrival", "actual"]));
  const delayMinutes = calculateDelayMinutes(
    scheduledArrival,
    actualArrival,
    readNumber(item, ["arrival", "delay"]) ??
      readNumber(item, ["departure", "delay"]),
  );

  return {
    flightNumber: normalizeFlightNumber(
      readString(item, ["flight", "iata"]) ?? flightNumber,
    ),
    flightDate: readString(item, ["flight_date"]) ?? normalizeFlightDate(date),
    departureAirportCode:
      readString(item, ["departure", "iata"])?.toUpperCase() ?? "",
    arrivalAirportCode:
      readString(item, ["arrival", "iata"])?.toUpperCase() ?? "",
    scheduledDeparture: parseApiDate(readString(item, ["departure", "scheduled"])),
    actualDeparture: parseApiDate(readString(item, ["departure", "actual"])),
    scheduledArrival,
    actualArrival,
    delayMinutes,
    flightStatus: mapFlightStatus(readString(item, ["flight_status"])),
    airlineIata:
      readString(item, ["airline", "iata"])?.toUpperCase() ??
      airlineIataFromFlightNumber(flightNumber),
    airlineName: readString(item, ["airline", "name"]) ?? "Nieznana linia",
    dataSource: ApiDataSource.AVIATION_STACK,
    rawResponse: response,
  };
}

function mapAeroDataBoxResponse(
  response: unknown,
  flightNumber: string,
  date: string,
): FlightApiData {
  const item = Array.isArray(response)
    ? response[0]
    : pickFirstArrayItem(readPath(response, ["flights"]));

  if (!item) {
    throw new FlightNotFoundError("AeroDataBox");
  }

  const scheduledArrival = parseApiDate(
    readString(item, ["arrival", "scheduledTime", "utc"]) ??
      readString(item, ["arrival", "scheduledTime", "local"]),
  );
  const actualArrival = parseApiDate(
    readString(item, ["arrival", "actualTime", "utc"]) ??
      readString(item, ["arrival", "actualTime", "local"]),
  );
  const delayMinutes = calculateDelayMinutes(
    scheduledArrival,
    actualArrival,
    readNumber(item, ["arrival", "delayMinutes"]) ??
      readNumber(item, ["departure", "delayMinutes"]),
  );

  return {
    flightNumber: normalizeFlightNumber(readString(item, ["number"]) ?? flightNumber),
    flightDate: normalizeFlightDate(date),
    departureAirportCode:
      readString(item, ["departure", "airport", "iata"])?.toUpperCase() ?? "",
    arrivalAirportCode:
      readString(item, ["arrival", "airport", "iata"])?.toUpperCase() ?? "",
    scheduledDeparture: parseApiDate(
      readString(item, ["departure", "scheduledTime", "utc"]) ??
        readString(item, ["departure", "scheduledTime", "local"]),
    ),
    actualDeparture: parseApiDate(
      readString(item, ["departure", "actualTime", "utc"]) ??
        readString(item, ["departure", "actualTime", "local"]),
    ),
    scheduledArrival,
    actualArrival,
    delayMinutes,
    flightStatus: mapFlightStatus(readString(item, ["status"])),
    airlineIata:
      readString(item, ["airline", "iata"])?.toUpperCase() ??
      airlineIataFromFlightNumber(flightNumber),
    airlineName: readString(item, ["airline", "name"]) ?? "Nieznana linia",
    dataSource: ApiDataSource.AERO_DATA_BOX,
    rawResponse: response,
  };
}

function getManualFallbackData(
  flightNumber: string,
  date: string,
  rawResponse: unknown,
): FlightApiData {
  return {
    flightNumber: normalizeFlightNumber(flightNumber),
    flightDate: normalizeFlightDate(date),
    departureAirportCode: "",
    arrivalAirportCode: "",
    scheduledDeparture: null,
    actualDeparture: null,
    scheduledArrival: null,
    actualArrival: null,
    delayMinutes: null,
    flightStatus: FlightStatus.UNKNOWN,
    airlineIata: airlineIataFromFlightNumber(flightNumber),
    airlineName: "Nieznana linia",
    dataSource: ApiDataSource.MANUAL,
    rawResponse,
  };
}

function getMockFlightData(flightNumber: string, date: string): FlightApiData {
  const normalized = normalizeFlightNumber(flightNumber);

  return {
    flightNumber: normalized,
    flightDate: normalizeFlightDate(date),
    departureAirportCode: "WAW",
    arrivalAirportCode: "LHR",
    scheduledDeparture: new Date(`${normalizeFlightDate(date)}T10:00:00.000Z`),
    actualDeparture: new Date(`${normalizeFlightDate(date)}T10:35:00.000Z`),
    scheduledArrival: new Date(`${normalizeFlightDate(date)}T12:45:00.000Z`),
    actualArrival: new Date(`${normalizeFlightDate(date)}T16:50:00.000Z`),
    delayMinutes: 245,
    flightStatus: FlightStatus.LANDED,
    airlineIata: airlineIataFromFlightNumber(normalized),
    airlineName: "Mock Airlines",
    dataSource: ApiDataSource.MANUAL,
    rawResponse: {
      mock: true,
      providerShape: "mapped",
    },
  };
}

function flightToApiData(flight: Flight & { airline: { iataCode: string; name: string } }): FlightApiData {
  return {
    flightNumber: flight.flightNumber,
    flightDate: flight.flightDate.toISOString().slice(0, 10),
    departureAirportCode: flight.departureAirportCode,
    arrivalAirportCode: flight.arrivalAirportCode,
    scheduledDeparture: flight.scheduledDeparture,
    actualDeparture: flight.actualDeparture,
    scheduledArrival: flight.scheduledArrival,
    actualArrival: flight.actualArrival,
    delayMinutes: flight.delayMinutes,
    flightStatus: flight.flightStatus,
    airlineIata: flight.airline.iataCode,
    airlineName: flight.airline.name,
    dataSource: ApiDataSource.CACHE,
    rawResponse: flight.rawApiResponse,
  };
}

async function persistFlightData(data: FlightApiData) {
  if (!hasPrismaDatabaseUrl()) {
    return null;
  }

  const airline = await prisma.airline.upsert({
    where: {
      iataCode: data.airlineIata,
    },
    update: {
      name: data.airlineName,
    },
    create: {
      iataCode: data.airlineIata,
      name: data.airlineName,
    },
  });

  const flightDate = dateFromFlightDate(data.flightDate);
  const delayMinutes = calculateDelayMinutes(
    data.scheduledArrival,
    data.actualArrival,
    data.delayMinutes,
  );

  const flight = await prisma.flight.upsert({
    where: {
      flightNumber_flightDate: {
        flightNumber: data.flightNumber,
        flightDate,
      },
    },
    update: {
      departureAirportCode: data.departureAirportCode,
      arrivalAirportCode: data.arrivalAirportCode,
      scheduledDeparture: data.scheduledDeparture,
      actualDeparture: data.actualDeparture,
      scheduledArrival: data.scheduledArrival,
      actualArrival: data.actualArrival,
      delayMinutes,
      flightStatus: data.flightStatus,
      amountCategory: calculateAmountCategory(),
      dataSource: data.dataSource,
      rawApiResponse: data.rawResponse as Prisma.InputJsonValue,
      lastApiRefreshAt: new Date(),
      airlineId: airline.id,
    },
    create: {
      flightNumber: data.flightNumber,
      flightDate,
      departureAirportCode: data.departureAirportCode,
      arrivalAirportCode: data.arrivalAirportCode,
      scheduledDeparture: data.scheduledDeparture,
      actualDeparture: data.actualDeparture,
      scheduledArrival: data.scheduledArrival,
      actualArrival: data.actualArrival,
      delayMinutes,
      flightStatus: data.flightStatus,
      amountCategory: calculateAmountCategory(),
      dataSource: data.dataSource,
      rawApiResponse: data.rawResponse as Prisma.InputJsonValue,
      lastApiRefreshAt: new Date(),
      airlineId: airline.id,
    },
    select: {
      id: true,
    },
  });

  return flight.id;
}

export async function fetchFromAviationStack(
  flightNumber: string,
  date: string,
) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;

  if (!apiKey) {
    throw new FlightApiError(
      "Brak konfiguracji AviationStack.",
      "AviationStack",
    );
  }

  const url = new URL("https://api.aviationstack.com/v1/flights");
  url.searchParams.set("access_key", apiKey);
  url.searchParams.set("flight_iata", normalizeFlightNumber(flightNumber));
  url.searchParams.set("flight_date", normalizeFlightDate(date));

  const response = await fetchJson(url.toString(), { method: "GET" }, "AviationStack");

  return mapAviationStackResponse(response, flightNumber, date);
}

export async function fetchFromAeroDataBox(
  flightNumber: string,
  date: string,
) {
  const apiKey = process.env.AERODATABOX_API_KEY;
  const host = process.env.AERODATABOX_API_HOST ?? "aerodatabox.p.rapidapi.com";

  if (!apiKey) {
    throw new FlightApiError("Brak konfiguracji AeroDataBox.", "AeroDataBox");
  }

  const url = `https://${host}/flights/number/${encodeURIComponent(
    normalizeFlightNumber(flightNumber),
  )}/${encodeURIComponent(normalizeFlightDate(date))}`;
  const response = await fetchJson(
    url,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": host,
      },
    },
    "AeroDataBox",
  );

  return mapAeroDataBoxResponse(response, flightNumber, date);
}

export async function fetchFlightData(
  flightNumber: string,
  date: string,
  options: FetchFlightOptions = {},
): Promise<FlightApiResult> {
  const normalizedFlightNumber = normalizeFlightNumber(flightNumber);
  const normalizedDate = normalizeFlightDate(date);
  const cacheTtlMs = options.cacheTtlMs ?? defaultCacheTtlMs;
  const warnings: string[] = [];

  if (!options.forceRefresh && hasPrismaDatabaseUrl()) {
    const cachedFlight = await prisma.flight.findUnique({
      where: {
        flightNumber_flightDate: {
          flightNumber: normalizedFlightNumber,
          flightDate: dateFromFlightDate(normalizedDate),
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

    if (
      cachedFlight?.lastApiRefreshAt &&
      Date.now() - cachedFlight.lastApiRefreshAt.getTime() < cacheTtlMs
    ) {
      return {
        data: flightToApiData(cachedFlight),
        warnings,
        cacheHit: true,
        persistedFlightId: cachedFlight.id,
      };
    }
  }

  if (process.env.USE_FLIGHT_API_MOCK === "true") {
    const data = getMockFlightData(normalizedFlightNumber, normalizedDate);
    const persistedFlightId = await persistFlightData(data);

    return {
      data,
      warnings: ["Użyto mocka API lotniczego."],
      cacheHit: false,
      persistedFlightId,
    };
  }

  for (const provider of [fetchFromAviationStack, fetchFromAeroDataBox]) {
    try {
      const data = await provider(normalizedFlightNumber, normalizedDate);
      const persistedFlightId = await persistFlightData(data);

      return {
        data,
        warnings,
        cacheHit: false,
        persistedFlightId,
      };
    } catch (error) {
      if (error instanceof FlightApiError) {
        warnings.push(`${error.provider}: ${error.message}`);
        continue;
      }

      warnings.push("Nieoczekiwany błąd providera API lotniczego.");
    }
  }

  const data = getManualFallbackData(normalizedFlightNumber, normalizedDate, {
    warnings,
  });
  const persistedFlightId = await persistFlightData(data);

  return {
    data,
    warnings: [
      ...warnings,
      "Zwrócono dane manualne, aby nie blokować pracy operatora.",
    ],
    cacheHit: false,
    persistedFlightId,
  };
}
