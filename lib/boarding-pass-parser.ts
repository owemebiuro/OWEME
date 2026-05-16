import {
  AIRLINES,
  AIRPORTS,
  findAirline,
  findAirport,
} from "@/lib/flight-checker-data";
import type { ParseResponse } from "@/types/claim";

export type BoardingPassSource = "barcode" | "ocr" | "pkpass";

export type BoardingPassParseSuccess = ParseResponse & {
  date: string;
  source: BoardingPassSource;
};

type RouteCandidate = {
  from: string;
  to: string;
};

type AirportAliasEntry = {
  alias: string;
  code: string;
  index: number;
  score: number;
};

type ParseOptions = {
  source?: BoardingPassSource;
  ocrConfidence?: number;
  hasBoardingPassContainer?: boolean;
  referenceDate?: Date;
};

type PassField = {
  key?: string;
  label?: string;
  value?: unknown;
};

type PassBarcode = {
  message?: string;
};

type ApplePassJson = {
  description?: string;
  organizationName?: string;
  relevantDate?: string;
  barcode?: PassBarcode;
  barcodes?: PassBarcode[];
  boardingPass?: {
    transitType?: string;
    primaryFields?: PassField[];
    secondaryFields?: PassField[];
    auxiliaryFields?: PassField[];
    backFields?: PassField[];
    headerFields?: PassField[];
  };
};

const KNOWN_AIRLINE_CODES = AIRLINES.map((airline) => airline.iata).sort(
  (a, b) => b.length - a.length,
);

const AIRLINE_CODE_PATTERN = KNOWN_AIRLINE_CODES.map(escapeRegExp).join("|");

const BOARDING_KEYWORDS = [
  /\bBOARDING\s+PASS\b/,
  /\bMOBILE\s+BOARDING\b/,
  /\bBOARDING\b/,
  /\bKARTY\s+POKLADOWE\b/,
  /\bPASSENGER\b/,
  /\bFLIGHT\b/,
  /\bFLIGHT\s+NO\b/,
  /\bFLIGHT\s+NUMBER\b/,
  /\bNUMER\s+LOTU\b/,
  /\bSEAT\b/,
  /\bGATE\b/,
  /\bTERMINAL\b/,
  /\bZONE\b/,
  /\bSEQ(?:UENCE)?\b/,
  /\bBOARDING\s+TIME\b/,
  /\bDEPARTURE\b/,
  /\bARRIVAL\b/,
  /\bPNR\b/,
  /\bBOOKING\b/,
  /\bRESERVATION\b/,
  /\bKARTA\s+POKLADOWA\b/,
  /\bPASAZER\b/,
  /\bBRAMKA\b/,
  /\bMIEJSCE\b/,
];

const ROUTE_NOISE_CODES = new Set([
  "AND",
  "APR",
  "AUG",
  "DEC",
  "FEB",
  "FOR",
  "GAT",
  "GTE",
  "JAN",
  "JUL",
  "JUN",
  "LOT",
  "MAR",
  "MAY",
  "NOV",
  "OCT",
  "PAX",
  "PDF",
  "PNG",
  "SEP",
  "THE",
]);

const TYPE_PRIORITY: Record<string, number> = {
  large_airport: 0,
  medium_airport: 2,
  small_airport: 5,
  heliport: 20,
  seaplane_base: 20,
  balloonport: 20,
};

const GENERIC_AIRPORT_WORDS = new Set([
  "AIRPORT",
  "AEROPORT",
  "AERODROME",
  "INTERNATIONAL",
  "INTL",
  "REGIONAL",
  "MUNICIPAL",
  "NATIONAL",
  "TERMINAL",
  "THE",
  "PORT",
  "LOTNICZY",
  "LOTNISKO",
  "IM",
  "IMIENIA",
]);

const MANUAL_AIRPORT_ALIASES: Array<[string, string]> = [
  ["WARSZAWA", "WAW"],
  ["WARSZAWA OKECIE", "WAW"],
  ["WARSZAWA-OKECIE", "WAW"],
  ["WARSZAWA CHOPINA", "WAW"],
  ["CHOPIN", "WAW"],
  ["MODLIN", "WMI"],
  ["WARSZAWA MODLIN", "WMI"],
  ["KRAKOW", "KRK"],
  ["KRAKOW BALICE", "KRK"],
  ["KRAKOW-BALICE", "KRK"],
  ["GDANSK", "GDN"],
  ["GDANSK REBIECHOWO", "GDN"],
  ["WROCLAW", "WRO"],
  ["KATOWICE", "KTW"],
  ["POZNAN", "POZ"],
  ["RZESZOW", "RZE"],
  ["LONDYN", "LHR"],
  ["LONDYN HEATHROW", "LHR"],
  ["LONDYN GATWICK", "LGW"],
  ["LONDYN STANSTED", "STN"],
  ["LONDYN LUTON", "LTN"],
  ["LIZBONA", "LIS"],
  ["LISBOA", "LIS"],
];

const MONTHS: Record<string, number> = {
  JAN: 1,
  STY: 1,
  FEB: 2,
  LUT: 2,
  MAR: 3,
  APR: 4,
  KWI: 4,
  MAY: 5,
  MAJ: 5,
  JUN: 6,
  CZE: 6,
  JUL: 7,
  LIP: 7,
  AUG: 8,
  SIE: 8,
  SEP: 9,
  SEPT: 9,
  WRZ: 9,
  OCT: 10,
  PAZ: 10,
  NOV: 11,
  LIS: 11,
  DEC: 12,
  GRU: 12,
};

const MONTH_PATTERN = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join("|");

let airportAliasEntries: AirportAliasEntry[] | null = null;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value: string) {
  return value
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (character) => {
      const replacements: Record<string, string> = {
        ą: "a",
        ć: "c",
        ę: "e",
        ł: "l",
        ń: "n",
        ó: "o",
        ś: "s",
        ź: "z",
        ż: "z",
        Ą: "A",
        Ć: "C",
        Ę: "E",
        Ł: "L",
        Ń: "N",
        Ó: "O",
        Ś: "S",
        Ź: "Z",
        Ż: "Z",
      };

      return replacements[character] ?? character;
    })
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014\u2192]/g, "-")
    .replace(/[|]/g, "I")
    .toUpperCase()
    .replace(/\\N{1,2}AW/g, " WAW");
}

function compactSpaces(value: string) {
  return value.replace(/[ \t]+/g, " ").trim();
}

function normalizeLookupValue(value: string) {
  return compactSpaces(normalizeText(value).replace(/[^A-Z0-9]+/g, " "));
}

function stripGenericAirportWords(value: string) {
  return normalizeLookupValue(value)
    .split(" ")
    .filter((word) => word && !GENERIC_AIRPORT_WORDS.has(word))
    .join(" ");
}

function airportScore(index: number, airportType: string | undefined, scheduled: boolean | undefined) {
  return (
    (scheduled ? 0 : 30) +
    (TYPE_PRIORITY[airportType ?? ""] ?? 12) +
    index / 100000
  );
}

function addAirportAlias(
  entries: Map<string, AirportAliasEntry>,
  aliasValue: string,
  code: string,
  score: number,
  index: number,
) {
  const alias = normalizeLookupValue(aliasValue);

  if (alias.length < 3 || ROUTE_NOISE_CODES.has(alias)) {
    return;
  }

  const existing = entries.get(alias);

  if (!existing || score < existing.score) {
    entries.set(alias, { alias, code, index, score });
  }
}

function getAirportAliasEntries() {
  if (airportAliasEntries) {
    return airportAliasEntries;
  }

  const entries = new Map<string, AirportAliasEntry>();

  AIRPORTS.forEach((airport, index) => {
    const baseScore = airportScore(index, airport.type, airport.scheduled);
    addAirportAlias(entries, airport.iata, airport.iata, baseScore - 25, index);
    addAirportAlias(entries, airport.name, airport.iata, baseScore, index);
    addAirportAlias(entries, airport.city, airport.iata, baseScore + 8, index);

    const strippedName = stripGenericAirportWords(airport.name);
    addAirportAlias(entries, strippedName, airport.iata, baseScore - 4, index);

    const nameParts = strippedName.split(" ");
    if (nameParts.length >= 2) {
      addAirportAlias(entries, nameParts.slice(0, 2).join(" "), airport.iata, baseScore - 2, index);
    }
  });

  MANUAL_AIRPORT_ALIASES.forEach(([alias, code], index) => {
    addAirportAlias(entries, alias, code, -50 + index / 1000, -1);
  });

  airportAliasEntries = [...entries.values()].sort((a, b) => {
    if (b.alias.length !== a.alias.length) {
      return b.alias.length - a.alias.length;
    }

    return a.score - b.score;
  });

  return airportAliasEntries;
}

function normalizeAirportCode(value: string) {
  return value
    .toUpperCase()
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/[^A-Z]/g, "");
}

function validAirportCode(value: string | undefined | null) {
  const code = normalizeAirportCode(value ?? "");

  if (code.length !== 3 || ROUTE_NOISE_CODES.has(code)) {
    return null;
  }

  return findAirport(code) ? code : null;
}

function normalizeCarrierCode(value: string) {
  const code = value
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^L0/, "LO")
    .replace(/^0S/, "OS");

  if (findAirline(code)) {
    return code;
  }

  if (code.length === 3 && findAirline(code.slice(0, 2))) {
    return code.slice(0, 2);
  }

  return code;
}

function normalizeFlightNumber(carrier: string, number: string) {
  const airline = normalizeCarrierCode(carrier);
  const flightDigits = number
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9A-Z]/g, "")
    .replace(/^0+(?=\d)/, "");

  if (!airline || !flightDigits || !/[A-Z]/.test(airline)) {
    return null;
  }

  const flightNumber = `${airline}${flightDigits}`;
  return /^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(flightNumber)
    ? flightNumber
    : null;
}

function normalizeOcrDigit(value: string) {
  return value
    .toUpperCase()
    .replace(/O|Q|D/g, "0")
    .replace(/I|L|\|/g, "1")
    .replace(/Z/g, "2")
    .replace(/S/g, "5")
    .replace(/G|E/g, "6")
    .replace(/B/g, "8")
    .replace(/[^0-9]/g, "");
}

function normalizeOcrFlightToken(token: string) {
  const normalized = token.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!normalized) {
    return null;
  }

  if (/^W[6EGBS8][A-Z0-9]{4,5}$/.test(normalized)) {
    const digits = normalizeOcrDigit(normalized.slice(2));

    if (digits.length >= 4) {
      return normalizeFlightNumber("W6", digits);
    }
  }

  return null;
}

function extractOcrFlightNumber(text: string) {
  for (const match of text.matchAll(/\b[A-Z0-9]{4,8}\b/g)) {
    const flightNumber = normalizeOcrFlightToken(match[0]);

    if (flightNumber) {
      return flightNumber;
    }
  }

  return null;
}

function airlineNameForFlight(flightNumber: string, text: string) {
  const normalized = normalizeText(text);
  const matchingCode = KNOWN_AIRLINE_CODES.find((code) =>
    flightNumber.startsWith(code),
  );
  const airline = matchingCode ? findAirline(matchingCode) : null;

  if (airline) {
    return airline.name;
  }

  return (
    AIRLINES.find((candidate) =>
      normalized.includes(normalizeText(candidate.name)),
    )?.name ?? ""
  );
}

function extractFlightNumber(text: string) {
  const labeledKnown = new RegExp(
    `\\b(?:FLIGHT(?:\\s*(?:NO|NUMBER|NR))?|NUMER\\s+LOTU|NR\\s+LOTU|FLT|FLUG|LOT|REJS|VOLO|VUELO|VOL)\\b\\D{0,24}(${AIRLINE_CODE_PATTERN})\\s*[- ]?\\s*(\\d{1,4}[A-Z]?)\\b`,
    "i",
  );
  const labeledKnownMatch = text.match(labeledKnown);

  if (labeledKnownMatch) {
    const flightNumber = normalizeFlightNumber(
      labeledKnownMatch[1],
      labeledKnownMatch[2],
    );

    if (flightNumber) {
      return flightNumber;
    }
  }

  const knownFlight = new RegExp(
    `\\b(${AIRLINE_CODE_PATTERN})\\s*[- ]?\\s*(\\d{1,4}[A-Z]?)\\b`,
    "gi",
  );

  for (const match of text.matchAll(knownFlight)) {
    const flightNumber = normalizeFlightNumber(match[1], match[2]);

    if (flightNumber) {
      return flightNumber;
    }
  }

  const ocrFlightNumber = extractOcrFlightNumber(text);

  if (ocrFlightNumber) {
    return ocrFlightNumber;
  }

  const labeledGeneric =
    /\b(?:FLIGHT(?:\s*(?:NO|NUMBER|NR))?|NUMER\s+LOTU|NR\s+LOTU|FLT|FLUG|REJS|VOLO|VUELO|VOL)\b\D{0,24}([A-Z0-9]{2,3})\s*[- ]?\s*(\d{1,4}[A-Z]?)\b/i;
  const labeledGenericMatch = text.match(labeledGeneric);

  if (!labeledGenericMatch) {
    return null;
  }

  const carrier = normalizeCarrierCode(labeledGenericMatch[1]);

  if (ROUTE_NOISE_CODES.has(carrier)) {
    return null;
  }

  return normalizeFlightNumber(carrier, labeledGenericMatch[2]);
}

function extractAirportOccurrences(text: string) {
  const occurrences: { code: string; index: number }[] = [];

  for (const match of text.matchAll(/\b[A-Z0-9]{3}\b/g)) {
    const code = validAirportCode(match[0]);

    if (code) {
      occurrences.push({ code, index: match.index ?? 0 });
    }
  }

  return occurrences;
}

function extractAirportAliasOccurrences(text: string) {
  const normalized = ` ${normalizeLookupValue(text)} `;
  const occurrences: { code: string; index: number; score: number; length: number }[] = [];

  for (const entry of getAirportAliasEntries()) {
    const paddedAlias = ` ${entry.alias} `;
    const index = normalized.indexOf(paddedAlias);

    if (index >= 0) {
      occurrences.push({ code: entry.code, index, score: entry.score, length: entry.alias.length });
    }
  }

  return occurrences.sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }

    if (b.length !== a.length) {
      return b.length - a.length;
    }

    return a.score - b.score;
  });
}

function findAirportsInText(text: string) {
  const occurrences = [
    ...extractAirportOccurrences(text).map((occurrence) => ({
      code: occurrence.code,
      index: occurrence.index,
      score: 0,
      length: 3,
    })),
    ...extractAirportAliasOccurrences(text),
  ].sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }

    if (b.length !== a.length) {
      return b.length - a.length;
    }

    return a.score - b.score;
  });
  const codes: string[] = [];

  for (const occurrence of occurrences) {
    if (!codes.includes(occurrence.code)) {
      codes.push(occurrence.code);
    }
  }

  return codes;
}

function findAirportInText(text: string) {
  return findAirportsInText(text)[0] ?? null;
}

function firstValidRoute(fromValue: string | undefined, toValue: string | undefined) {
  const from = validAirportCode(fromValue);
  const to = validAirportCode(toValue);

  return from && to && from !== to ? { from, to } : null;
}

function firstValidRouteCodes(from: string | null | undefined, to: string | null | undefined) {
  return from && to && from !== to && findAirport(from) && findAirport(to)
    ? { from, to }
    : null;
}

function routeFromSegmentedText(text: string) {
  const compact = compactSpaces(text);
  const patterns = [
    /\b(?:FROM|ORIGIN|DEPARTURE|DEPART|WYL(?:OT|OTU)?|Z)\b([\s\S]{1,100}?)\b(?:TO|DESTINATION|ARRIVAL|ARRIVE|PRZYL(?:OT|OTU)?|DO)\b([\s\S]{1,100})/i,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);

    if (!match) {
      continue;
    }

    const route = firstValidRouteCodes(
      findAirportInText(match[1]),
      findAirportInText(match[2]),
    );

    if (route) {
      return route;
    }
  }

  return null;
}

function routeFromSeparatedLine(line: string) {
  const parts = line.split(/\s+(?:-|->|TO|DO)\s+/i);

  if (parts.length < 2) {
    return null;
  }

  for (let index = 0; index < parts.length - 1; index += 1) {
    const route = firstValidRouteCodes(
      findAirportInText(parts[index]),
      findAirportInText(parts[index + 1]),
    );

    if (route) {
      return route;
    }
  }

  return null;
}

function routeAroundFlightLine(lines: string[], lineIndex: number) {
  if (!extractFlightNumber(lines[lineIndex])) {
    return null;
  }

  const sameLineCodes = findAirportsInText(lines[lineIndex]);

  if (sameLineCodes.length >= 2) {
    return firstValidRouteCodes(sameLineCodes[0], sameLineCodes[1]);
  }

  let previousAirport: string | null = null;
  let nextAirport: string | null = null;

  for (let index = lineIndex - 1; index >= Math.max(0, lineIndex - 3); index -= 1) {
    const [code] = findAirportsInText(lines[index]);

    if (code) {
      previousAirport = code;
      break;
    }
  }

  for (
    let index = lineIndex + 1;
    index < Math.min(lines.length, lineIndex + 4);
    index += 1
  ) {
    const [code] = findAirportsInText(lines[index]);

    if (code) {
      nextAirport = code;
      break;
    }
  }

  const nearbyRoute = firstValidRouteCodes(previousAirport, nextAirport);

  if (nearbyRoute) {
    return nearbyRoute;
  }

  const codes: string[] = [];

  for (
    let index = Math.max(0, lineIndex - 3);
    index < Math.min(lines.length, lineIndex + 4);
    index += 1
  ) {
    for (const code of findAirportsInText(lines[index])) {
      if (!codes.includes(code)) {
        codes.push(code);
      }
    }
  }

  return firstValidRouteCodes(codes[0], codes[1]);
}

function findAirportNearLine(lines: string[], startIndex: number) {
  for (let index = startIndex; index < Math.min(lines.length, startIndex + 3); index += 1) {
    const code = findAirportInText(lines[index]);

    if (code) {
      return code;
    }
  }

  return null;
}

function extractRouteFromLines(text: string) {
  let from: string | null = null;
  let to: string | null = null;
  const lines = text.split(/\n+/).map((line) => compactSpaces(line));

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const flightLineRoute = routeAroundFlightLine(lines, index);

    if (flightLineRoute) {
      return flightLineRoute;
    }

    const separatedRoute = routeFromSeparatedLine(line);

    if (separatedRoute) {
      return separatedRoute;
    }

    if (/\b(FROM|ORIGIN|DEPARTURE|DEPART|WYL(?:OT|OTU|OTU)?|Z)\b/.test(line)) {
      from = from ?? findAirportNearLine(lines, index);
    }

    if (/\b(TO|DESTINATION|ARRIVAL|ARRIVE|PRZYL(?:OT|OTU|OTU)?|DO)\b/.test(line)) {
      to = to ?? findAirportNearLine(lines, index);
    }
  }

  return firstValidRouteCodes(from, to);
}

function extractRoute(text: string): RouteCandidate | null {
  const compact = compactSpaces(text);
  const segmentedRoute = routeFromSegmentedText(compact);

  if (segmentedRoute) {
    return segmentedRoute;
  }

  const lineRoute = extractRouteFromLines(text);

  if (lineRoute) {
    return lineRoute;
  }

  const explicitPatterns = [
    /\b(?:FROM|ORIGIN|DEPARTURE|DEPART|WYL(?:OT|OTU)?|Z)\b\D{0,24}?([A-Z0-9]{3})[\s\S]{0,100}?\b(?:TO|DESTINATION|ARRIVAL|ARRIVE|PRZYL(?:OT|OTU)?|DO)\b\D{0,24}?([A-Z0-9]{3})/i,
    /\b([A-Z0-9]{3})\s*(?:->|-|TO|DO)\s*([A-Z0-9]{3})\b/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = compact.match(pattern);
    const route = match ? firstValidRoute(match[1], match[2]) : null;

    if (route) {
      return route;
    }
  }

  const occurrences = extractAirportOccurrences(compact);
  const uniqueCodes: string[] = [];

  for (const occurrence of occurrences) {
    if (!uniqueCodes.includes(occurrence.code)) {
      uniqueCodes.push(occurrence.code);
    }

    if (uniqueCodes.length >= 2) {
      break;
    }
  }

  const codeRoute = firstValidRoute(uniqueCodes[0], uniqueCodes[1]);

  if (codeRoute) {
    return codeRoute;
  }

  const aliasOccurrences = extractAirportAliasOccurrences(compact);
  const uniqueAliasCodes: string[] = [];

  for (const occurrence of aliasOccurrences) {
    if (!uniqueAliasCodes.includes(occurrence.code)) {
      uniqueAliasCodes.push(occurrence.code);
    }

    if (uniqueAliasCodes.length >= 2) {
      break;
    }
  }

  return firstValidRouteCodes(uniqueAliasCodes[0], uniqueAliasCodes[1]);
}

function parseYear(value: string | undefined, referenceDate: Date) {
  if (!value) {
    return referenceDate.getUTCFullYear();
  }

  const year = Number(value);

  if (value.length === 2) {
    return year < 70 ? 2000 + year : 1900 + year;
  }

  return year;
}

function formatIsoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function inferYearForMonthDay(month: number, day: number, referenceDate: Date) {
  const currentYear = referenceDate.getUTCFullYear();
  const currentYearDate = new Date(Date.UTC(currentYear, month - 1, day));
  const tomorrow = new Date(referenceDate);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  return currentYearDate <= tomorrow ? currentYear : currentYear - 1;
}

function parseDateFromParts(
  dayValue: string,
  monthValue: string,
  yearValue: string | undefined,
  referenceDate: Date,
) {
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = yearValue
    ? parseYear(yearValue, referenceDate)
    : inferYearForMonthDay(month, day, referenceDate);

  return formatIsoDate(year, month, day);
}

function isLikelyBirthdateMatch(text: string, index: number) {
  const context = text.slice(Math.max(0, index - 24), index);
  return /\b(BIRTHDATE|BIRTHDAY|DOB|DATE\s+OF\s+BIRTH|DATA\s+URODZENIA)\b/.test(context);
}

function extractDate(text: string, referenceDate: Date) {
  const labeledNumericWithoutYear = text.match(
    /\b(?:DATE|DATA|DEPARTURE|DEPART|WYL(?:OT|OTU)?)\b\D{0,16}(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])\b/,
  );

  if (labeledNumericWithoutYear) {
    return parseDateFromParts(
      labeledNumericWithoutYear[1],
      labeledNumericWithoutYear[2],
      undefined,
      referenceDate,
    );
  }

  const labeledDayMonthMatch = text.match(
    new RegExp(
      `\\b(?:DATE|DATA|DEPARTURE|DEPART|WYL(?:OT|OTU)?)\\b\\D{0,16}(0?[1-9]|[12]\\d|3[01])\\s*(${MONTH_PATTERN})\\s*['’]?(20\\d{2}|\\d{2})?\\b`,
    ),
  );

  if (labeledDayMonthMatch) {
    const month = MONTHS[labeledDayMonthMatch[2]];
    const year = labeledDayMonthMatch[3]
      ? parseYear(labeledDayMonthMatch[3], referenceDate)
      : inferYearForMonthDay(month, Number(labeledDayMonthMatch[1]), referenceDate);

    return formatIsoDate(year, month, Number(labeledDayMonthMatch[1]));
  }

  const dayMonthMatch = text.match(
    new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])\\s*(${MONTH_PATTERN})\\s*['’]?(20\\d{2}|\\d{2})?\\b`),
  );

  if (dayMonthMatch) {
    const month = MONTHS[dayMonthMatch[2]];
    const year = dayMonthMatch[3]
      ? parseYear(dayMonthMatch[3], referenceDate)
      : inferYearForMonthDay(month, Number(dayMonthMatch[1]), referenceDate);

    return formatIsoDate(year, month, Number(dayMonthMatch[1]));
  }

  const monthDayMatch = text.match(
    new RegExp(`\\b(${MONTH_PATTERN})\\s*(0?[1-9]|[12]\\d|3[01])(?:,?\\s*['’]?(20\\d{2}|\\d{2}))?\\b`),
  );

  if (monthDayMatch) {
    const month = MONTHS[monthDayMatch[1]];
    const day = Number(monthDayMatch[2]);
    const year = monthDayMatch[3]
      ? parseYear(monthDayMatch[3], referenceDate)
      : inferYearForMonthDay(month, day, referenceDate);

    return formatIsoDate(year, month, day);
  }

  const isoPattern = /\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/g;

  for (const match of text.matchAll(isoPattern)) {
    if (!isLikelyBirthdateMatch(text, match.index ?? 0)) {
      return formatIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
    }
  }

  const numericPattern =
    /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2}|\d{2})\b/g;

  for (const match of text.matchAll(numericPattern)) {
    if (!isLikelyBirthdateMatch(text, match.index ?? 0)) {
      return parseDateFromParts(match[1], match[2], match[3], referenceDate);
    }
  }

  return null;
}

function dateFromDayOfYear(dayOfYear: number, referenceDate: Date) {
  if (!Number.isInteger(dayOfYear) || dayOfYear < 1 || dayOfYear > 366) {
    return null;
  }

  const currentYear = referenceDate.getUTCFullYear();
  const tomorrow = new Date(referenceDate);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  for (let year = currentYear; year >= currentYear - 3; year -= 1) {
    const date = new Date(Date.UTC(year, 0, dayOfYear));

    if (date.getUTCFullYear() === year && date <= tomorrow) {
      return date.toISOString().slice(0, 10);
    }
  }

  return new Date(Date.UTC(currentYear, 0, dayOfYear)).toISOString().slice(0, 10);
}

function hasBoardingPassSignals(text: string) {
  return BOARDING_KEYWORDS.some((keyword) => keyword.test(text));
}

function confidenceScore(input: {
  source: BoardingPassSource;
  hasBoardingSignals: boolean;
  hasContainer: boolean;
  ocrConfidence?: number;
}) {
  if (input.source === "barcode") {
    return 0.94;
  }

  if (input.source === "pkpass") {
    return 0.9;
  }

  const ocrPart = Math.max(0, Math.min(1, (input.ocrConfidence ?? 65) / 100)) * 0.2;
  const signalPart = input.hasBoardingSignals || input.hasContainer ? 0.2 : 0;
  return Number((0.58 + ocrPart + signalPart).toFixed(2));
}

export function parseBoardingPassText(
  rawText: string,
  options: ParseOptions = {},
): BoardingPassParseSuccess | null {
  const text = normalizeText(rawText);
  const referenceDate = options.referenceDate ?? new Date();
  const flightNumber = extractFlightNumber(text);
  const route = extractRoute(text);
  const flightDate = extractDate(text, referenceDate);
  const hasBoardingSignals = hasBoardingPassSignals(text);
  const hasContainer = options.hasBoardingPassContainer === true;

  if (!flightNumber || !route || !flightDate) {
    return null;
  }

  if (!hasBoardingSignals && !hasContainer) {
    return null;
  }

  const airline = airlineNameForFlight(flightNumber, text);
  const confidence = confidenceScore({
    source: options.source ?? "ocr",
    hasBoardingSignals,
    hasContainer,
    ocrConfidence: options.ocrConfidence,
  });

  return {
    flightNumber,
    flightDate,
    date: flightDate,
    airline,
    from: route.from,
    to: route.to,
    confidence,
    source: options.source ?? "ocr",
  };
}

export function parseBcbpPayload(
  payload: string,
  options: Pick<ParseOptions, "referenceDate"> = {},
): BoardingPassParseSuccess | null {
  const compactPayload = payload.replace(/[\r\n]/g, "");

  if (!compactPayload.startsWith("M") || compactPayload.length < 47) {
    return null;
  }

  const from = validAirportCode(compactPayload.slice(30, 33));
  const to = validAirportCode(compactPayload.slice(33, 36));
  const carrier = normalizeCarrierCode(compactPayload.slice(36, 39));
  const number = compactPayload.slice(39, 44);
  const dayOfYear = Number(compactPayload.slice(44, 47));
  const flightNumber = normalizeFlightNumber(carrier, number);
  const flightDate = dateFromDayOfYear(dayOfYear, options.referenceDate ?? new Date());

  if (!from || !to || from === to || !flightNumber || !flightDate) {
    return null;
  }

  return {
    flightNumber,
    flightDate,
    date: flightDate,
    airline: airlineNameForFlight(flightNumber, payload),
    from,
    to,
    confidence: 0.96,
    source: "barcode",
  };
}

export function parseBarcodePayload(
  payload: string,
  options: Pick<ParseOptions, "referenceDate"> = {},
) {
  return (
    parseBcbpPayload(payload, options) ??
    parseBoardingPassText(payload, {
      source: "barcode",
      hasBoardingPassContainer: true,
      referenceDate: options.referenceDate,
    })
  );
}

function collectPassFields(pass: ApplePassJson) {
  const boardingPass = pass.boardingPass;

  if (!boardingPass) {
    return [];
  }

  return [
    ...(boardingPass.headerFields ?? []),
    ...(boardingPass.primaryFields ?? []),
    ...(boardingPass.secondaryFields ?? []),
    ...(boardingPass.auxiliaryFields ?? []),
    ...(boardingPass.backFields ?? []),
  ];
}

function fieldToText(field: PassField) {
  return [field.key, field.label, field.value]
    .filter((value) => value !== undefined && value !== null)
    .map(String)
    .join(" ");
}

export function parsePkpassJson(
  pass: ApplePassJson,
  options: Pick<ParseOptions, "referenceDate"> = {},
) {
  const barcodes = [pass.barcode, ...(pass.barcodes ?? [])].filter(
    (barcode): barcode is PassBarcode => Boolean(barcode?.message),
  );

  for (const barcode of barcodes) {
    const parsed = parseBarcodePayload(barcode.message ?? "", options);

    if (parsed) {
      return { ...parsed, source: "pkpass" as const, confidence: 0.94 };
    }
  }

  const text = [
    pass.description,
    pass.organizationName,
    pass.boardingPass?.transitType,
    pass.relevantDate,
    ...collectPassFields(pass).map(fieldToText),
  ]
    .filter(Boolean)
    .join("\n");

  return parseBoardingPassText(text, {
    source: "pkpass",
    hasBoardingPassContainer: Boolean(pass.boardingPass),
    referenceDate: options.referenceDate,
  });
}
