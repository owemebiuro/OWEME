import type {
  ApiDataSource,
  ClaimAmountCategory,
  FlightStatus,
} from "@prisma/client";

export const FLIGHTAWARE_DATA_SOURCE: ApiDataSource = "AVIATION_STACK";

export type FlightResultDataSource = "AEROAPI" | "CACHE" | "MANUAL";

export type NormalizedFlightData = {
  flightNumber: string;
  flightDate: string;
  airlineName: string | null;
  airlineIata: string | null;
  departureAirportCode: string | null;
  departureAirportName: string | null;
  departureLatitude: number | null;
  departureLongitude: number | null;
  arrivalAirportCode: string | null;
  arrivalAirportName: string | null;
  arrivalLatitude: number | null;
  arrivalLongitude: number | null;
  scheduledDeparture: Date | null;
  actualDeparture: Date | null;
  scheduledArrival: Date | null;
  actualArrival: Date | null;
  distanceKm: number | null;
  delayMinutes: number | null;
  flightStatus: FlightStatus;
  dataSource: ApiDataSource;
  rawResponse: unknown;
  externalApiId: string | null;
  amountCategory: ClaimAmountCategory | null;
};

export type FlightLookupFlight = {
  id?: string;
  flightNumber: string;
  flightDate: string;
  airlineName: string | null;
  airlineIata: string | null;
  departureAirportCode: string | null;
  departureAirportName: string | null;
  arrivalAirportCode: string | null;
  arrivalAirportName: string | null;
  scheduledDeparture: string | null;
  actualDeparture: string | null;
  scheduledArrival: string | null;
  actualArrival: string | null;
  distanceKm: number | null;
  delayMinutes: number | null;
  flightStatus: FlightStatus;
  dataSource: FlightResultDataSource;
};

export type FlightCompensationResult = {
  amountEur: 250 | 400 | 600 | null;
  category: ClaimAmountCategory | null;
  reason: string;
};

export type FlightDataLookupResult = {
  found: boolean;
  flight: FlightLookupFlight | null;
  compensation: FlightCompensationResult;
  error?: string;
  warnings: string[];
  cacheHit: boolean;
  persistedFlightId: string | null;
};

export type FlightAwareAirport = {
  code_iata?: string | null;
  code_icao?: string | null;
  code_lid?: string | null;
  code?: string | null;
  iata?: string | null;
  name?: string | null;
  airport_name?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lon?: number | null;
  position?: {
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lon?: number | null;
  } | null;
};

export type FlightAwareOperator = {
  iata?: string | null;
  icao?: string | null;
  name?: string | null;
  shortname?: string | null;
};

export type FlightAwareFlightRecord = {
  fa_flight_id?: string | null;
  ident?: string | null;
  ident_iata?: string | null;
  ident_icao?: string | null;
  operator?: string | FlightAwareOperator | null;
  operator_icao?: string | null;
  operator_iata?: string | null;
  operator_name?: string | null;
  flight_number?: string | null;
  registration?: string | null;
  origin?: FlightAwareAirport | null;
  destination?: FlightAwareAirport | null;
  departure_delay?: number | null;
  arrival_delay?: number | null;
  scheduled_out?: string | null;
  estimated_out?: string | null;
  actual_out?: string | null;
  scheduled_off?: string | null;
  estimated_off?: string | null;
  actual_off?: string | null;
  scheduled_on?: string | null;
  estimated_on?: string | null;
  actual_on?: string | null;
  scheduled_in?: string | null;
  estimated_in?: string | null;
  actual_in?: string | null;
  cancelled?: boolean | null;
  diverted?: boolean | null;
  status?: string | null;
  route_distance?: number | null;
  route_distance_km?: number | null;
  distance?: number | null;
  distance_km?: number | null;
  distance_nm?: number | null;
};

export type FlightAwareFlightsResponse = {
  flights?: FlightAwareFlightRecord[] | null;
  links?: {
    next?: string | null;
  } | null;
};

export class FlightAwareAeroApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "FlightAwareAeroApiError";
  }
}

export class FlightAwareAeroApiConfigurationError extends FlightAwareAeroApiError {
  constructor(message = "Brak konfiguracji FlightAware AeroAPI.") {
    super(message);
    this.name = "FlightAwareAeroApiConfigurationError";
  }
}

export class FlightAwareAeroApiNotFoundError extends FlightAwareAeroApiError {
  constructor(message = "Nie znaleziono lotu w FlightAware AeroAPI.") {
    super(message, 404);
    this.name = "FlightAwareAeroApiNotFoundError";
  }
}

export class FlightAwareAeroApiMappingError extends FlightAwareAeroApiError {
  constructor(message = "Nie udało się zmapować danych lotu z FlightAware AeroAPI.") {
    super(message);
    this.name = "FlightAwareAeroApiMappingError";
  }
}
