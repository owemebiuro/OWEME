import "server-only";

import {
  FlightAwareAeroApiConfigurationError,
  FlightAwareAeroApiError,
  FlightAwareAeroApiNotFoundError,
  type FlightAwareFlightsResponse,
} from "@/lib/flightaware/aeroapi.types";

const DEFAULT_BASE_URL = "https://aeroapi.flightaware.com/aeroapi";
const DEFAULT_TIMEOUT_MS = 10_000;

export type FlightAwareConfigurationStatus = {
  configured: boolean;
  missingEnv: string[];
  baseUrl: string;
  timeoutMs: number;
};

function normalizeFlightNumber(flightNumber: string) {
  return flightNumber.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeFlightDate(date: string) {
  return date.trim().slice(0, 10);
}

function getConfiguredBaseUrl() {
  return (
    process.env.FLIGHTAWARE_AEROAPI_BASE_URL?.trim().replace(/\/+$/, "") ??
    DEFAULT_BASE_URL
  );
}

function getConfiguredTimeoutMs() {
  const parsed = Number(process.env.FLIGHTAWARE_AEROAPI_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

export function getFlightAwareConfigurationStatus(): FlightAwareConfigurationStatus {
  const missingEnv: string[] = [];

  if (!process.env.FLIGHTAWARE_AEROAPI_KEY?.trim()) {
    missingEnv.push("FLIGHTAWARE_AEROAPI_KEY");
  }

  return {
    configured: missingEnv.length === 0,
    missingEnv,
    baseUrl: getConfiguredBaseUrl(),
    timeoutMs: getConfiguredTimeoutMs(),
  };
}

export function isFlightAwareConfigured() {
  return getFlightAwareConfigurationStatus().configured;
}

function getApiKey() {
  const status = getFlightAwareConfigurationStatus();
  const apiKey = process.env.FLIGHTAWARE_AEROAPI_KEY?.trim();

  if (!apiKey || !status.configured) {
    throw new FlightAwareAeroApiConfigurationError(
      `Brakuje konfiguracji FlightAware AeroAPI (${status.missingEnv.join(", ")}).`,
    );
  }

  return apiKey;
}

function createDateWindow(date: string) {
  const normalizedDate = normalizeFlightDate(date);
  const start = new Date(`${normalizedDate}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function requestAeroApi(
  path: string,
  searchParams: URLSearchParams,
): Promise<FlightAwareFlightsResponse> {
  const apiKey = getApiKey();
  const baseUrl = getConfiguredBaseUrl();
  const timeoutMs = getConfiguredTimeoutMs();
  const url = new URL(`${baseUrl}${path}`);
  url.search = searchParams.toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        "x-apikey": apiKey,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      throw new FlightAwareAeroApiNotFoundError();
    }

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      throw new FlightAwareAeroApiError(
        `FlightAware AeroAPI zwróciło HTTP ${response.status}.`,
        response.status,
        responseText.slice(0, 500),
      );
    }

    return (await response.json()) as FlightAwareFlightsResponse;
  } catch (error) {
    if (
      error instanceof FlightAwareAeroApiConfigurationError ||
      error instanceof FlightAwareAeroApiNotFoundError ||
      error instanceof FlightAwareAeroApiError
    ) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new FlightAwareAeroApiError(
        "FlightAware AeroAPI przekroczyło limit czasu odpowiedzi.",
      );
    }

    throw new FlightAwareAeroApiError(
      "Nie udało się połączyć z FlightAware AeroAPI.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function queryFlightEndpoint(path: string, flightNumber: string, date: string) {
  const { start, end } = createDateWindow(date);
  const params = new URLSearchParams({
    start,
    end,
    max_pages: "1",
    ident_type: "designator",
  });

  return requestAeroApi(
    `${path}/${encodeURIComponent(normalizeFlightNumber(flightNumber))}`,
    params,
  );
}

export async function fetchFlightAwareFlights(
  flightNumber: string,
  date: string,
) {
  const targetDate = normalizeFlightDate(date);
  const today = new Date().toISOString().slice(0, 10);
  const endpoints =
    targetDate < today
      ? ["/history/flights", "/flights"]
      : ["/flights", "/history/flights"];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await queryFlightEndpoint(endpoint, flightNumber, date);

      if (response.flights?.length) {
        return response;
      }

      lastError = new FlightAwareAeroApiNotFoundError();
    } catch (error) {
      if (error instanceof FlightAwareAeroApiNotFoundError) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new FlightAwareAeroApiNotFoundError();
}
