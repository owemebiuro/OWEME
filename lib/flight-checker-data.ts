import airportsData from "./airports.generated.json";
import { airlineCrmData } from "./airlines/airline-crm-data";

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  type?: string;
  scheduled?: boolean;
}

export interface Airline {
  iata: string;
  name: string;
  aliases?: readonly string[];
}

export type Disruption = "delay" | "cancel" | "denied";
export type DelayHours = "3plus" | "less3" | "never";

export const AIRPORTS = airportsData as readonly Airport[];

const AIRPORT_BY_IATA = new Map(
  AIRPORTS.map((airport) => [airport.iata, airport]),
);

const POPULAR_AIRPORT_CODES = [
  "WAW",
  "KRK",
  "GDN",
  "WRO",
  "KTW",
  "POZ",
  "LHR",
  "CDG",
  "AMS",
  "FRA",
  "JFK",
  "LAX",
] as const;

const AIRPORT_SEARCH_ALIASES: Record<string, readonly string[]> = {
  WAW: ["Warszawa", "Okęcie", "Lotnisko Chopina"],
  WMI: ["Warszawa Modlin", "Modlin"],
  RDO: ["Warszawa Radom"],
  LHR: ["Londyn", "Londyn Heathrow"],
  LGW: ["Londyn Gatwick"],
  STN: ["Londyn Stansted"],
  LTN: ["Londyn Luton"],
  LCY: ["Londyn City"],
  CDG: ["Paryż", "Paryż Charles de Gaulle"],
  ORY: ["Paryż Orly"],
  FCO: ["Rzym"],
  CIA: ["Rzym Ciampino"],
  MUC: ["Monachium"],
  VIE: ["Wiedeń"],
  PRG: ["Praga"],
  BUD: ["Budapeszt"],
  ATH: ["Ateny"],
  IST: ["Stambuł"],
  DXB: ["Dubaj"],
  JFK: ["Nowy Jork"],
  EWR: ["Nowy Jork Newark"],
  NRT: ["Tokio Narita"],
  HND: ["Tokio Haneda"],
};

const TYPE_PRIORITY: Record<string, number> = {
  large_airport: 0,
  medium_airport: 1,
  small_airport: 2,
  seaplane_base: 3,
  heliport: 4,
  balloonport: 5,
};

const EXTRA_AIRLINES: readonly Airline[] = [
  { iata: "U2", name: "easyJet" },
  { iata: "EK", name: "Emirates" },
  { iata: "QR", name: "Qatar Airways" },
  { iata: "HV", name: "Transavia" },
  { iata: "VS", name: "Virgin Atlantic" },
  { iata: "UA", name: "United Airlines" },
  { iata: "DL", name: "Delta Air Lines" },
  { iata: "AA", name: "American Airlines" },
  { iata: "AC", name: "Air Canada" },
] as const;

function displayAirlineName(aliases: readonly string[] | undefined, legalName: string) {
  return aliases?.at(-1) ?? legalName;
}

const CRM_AIRLINES: readonly Airline[] = airlineCrmData.map((airline) => ({
  iata: airline.iata,
  name: displayAirlineName(airline.aliases, airline.name),
  aliases: airline.aliases,
}));

const CRM_AIRLINE_CODES = new Set(CRM_AIRLINES.map((airline) => airline.iata));

export const AIRLINES: readonly Airline[] = [
  ...CRM_AIRLINES,
  ...EXTRA_AIRLINES.filter((airline) => !CRM_AIRLINE_CODES.has(airline.iata)),
] as const;

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function typeRank(airport: Airport) {
  return TYPE_PRIORITY[airport.type ?? ""] ?? 9;
}

function airportSearchText(airport: Airport) {
  return normalizeSearch(
    `${airport.iata} ${airport.name} ${airport.city} ${airport.country} ${
      AIRPORT_SEARCH_ALIASES[airport.iata]?.join(" ") ?? ""
    }`,
  );
}

function airportScore(airport: Airport, normalizedQuery: string) {
  const iata = airport.iata.toLowerCase();
  const name = normalizeSearch(airport.name);
  const city = normalizeSearch(airport.city);
  const country = normalizeSearch(airport.country);
  const aliases = (AIRPORT_SEARCH_ALIASES[airport.iata] ?? []).map((alias) =>
    normalizeSearch(alias),
  );
  const aliasText = aliases.join(" ");
  const haystack = `${iata} ${name} ${city} ${country} ${aliasText}`;

  if (iata === normalizedQuery) return 0;
  if (iata.startsWith(normalizedQuery)) return 1;
  if (city.startsWith(normalizedQuery)) return 2;
  if (aliases.some((alias) => alias.startsWith(normalizedQuery))) return 2;
  if (name.startsWith(normalizedQuery)) return 3;
  if (country.startsWith(normalizedQuery)) return 4;
  if (haystack.includes(normalizedQuery)) return 5;

  return Number.POSITIVE_INFINITY;
}

export function searchAirports(query: string) {
  const normalized = normalizeSearch(query);

  if (!normalized) {
    return POPULAR_AIRPORT_CODES.map((code) => AIRPORT_BY_IATA.get(code)).filter(
      (airport): airport is Airport => Boolean(airport),
    );
  }

  return AIRPORTS.map((airport) => ({
    airport,
    score: airportScore(airport, normalized),
  }))
    .filter((result) => Number.isFinite(result.score))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.airport.scheduled !== b.airport.scheduled) {
        return a.airport.scheduled ? -1 : 1;
      }
      const typeDifference = typeRank(a.airport) - typeRank(b.airport);
      if (typeDifference !== 0) return typeDifference;

      return airportSearchText(a.airport).localeCompare(
        airportSearchText(b.airport),
      );
    })
    .slice(0, 12)
    .map((result) => result.airport);
}

export function searchAirlines(query: string) {
  const normalized = normalizeSearch(query);

  if (!normalized) {
    return AIRLINES.slice(0, 8);
  }

  return AIRLINES.filter((airline) => {
    const haystack = normalizeSearch(
      `${airline.iata} ${airline.name} ${(airline.aliases ?? []).join(" ")}`,
    );
    return haystack.includes(normalized);
  }).slice(0, 12);
}

export function findAirport(iata: string | null | undefined) {
  const normalized = iata?.trim().toUpperCase();
  return normalized ? (AIRPORT_BY_IATA.get(normalized) ?? null) : null;
}

export function findAirline(value: string | null | undefined) {
  const normalized = normalizeSearch(value ?? "");

  if (!normalized) {
    return null;
  }

  return (
    AIRLINES.find(
      (airline) =>
        normalizeSearch(airline.iata) === normalized ||
        normalizeSearch(airline.name) === normalized ||
        (airline.aliases ?? []).some(
          (alias) => normalizeSearch(alias) === normalized,
        ),
    ) ?? null
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceKm(from: Airport, to: Airport) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function compensationAmount(fromCode: string, toCode: string) {
  const from = findAirport(fromCode);
  const to = findAirport(toCode);

  if (!from || !to) {
    return 400;
  }

  const distance = distanceKm(from, to);

  if (distance < 1500) {
    return 250;
  }

  if (distance <= 3500) {
    return 400;
  }

  return 600;
}
