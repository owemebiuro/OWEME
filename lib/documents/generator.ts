import { readFile } from "node:fs/promises";
import path from "node:path";

import { DocumentType, NoteType, Prisma } from "@prisma/client";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { distanceKm, findAirport } from "@/lib/flight-checker-data";
import { prisma } from "@/lib/prisma";
import { getDocumentStorageKey, uploadObject } from "@/lib/storage/r2";

export const documentClaimInclude = {
  client: true,
  flight: {
    include: {
      airline: true,
    },
  },
  airline: true,
  passengers: true,
  documents: true,
  payouts: true,
} satisfies Prisma.ClaimInclude;

export type FullClaim = Prisma.ClaimGetPayload<{
  include: typeof documentClaimInclude;
}>;

type TemplateFieldName =
  | "imie"
  | "nazwisko"
  | "imie_nazwisko"
  | "adres"
  | "email"
  | "telefon"
  | "pesel_nip"
  | "numer_dokumentu"
  | "numer_sprawy"
  | "numer_lotu"
  | "data_lotu"
  | "lotnisko_wylotu"
  | "lotnisko_przylotu"
  | "lotnisko_wylotu_nazwa"
  | "lotnisko_przylotu_nazwa"
  | "kwota_roszczenia"
  | "kwota_roszczenia_eur"
  | "kwota_roszczenia_pln"
  | "nazwa_linii"
  | "kod_iata_linii"
  | "adres_linii"
  | "kod_pocztowy_linii"
  | "miasto_linii"
  | "kraj_linii"
  | "email_reklamacyjny_linii"
  | "rejestr_linii"
  | "opoznienie"
  | "opoznienie_minuty"
  | "dystans_trasy_km"
  | "kategoria_kwoty"
  | "prog_art7"
  | "typ_zdarzenia"
  | "okolicznosci_zdarzenia"
  | "numer_pisma"
  | "data_sporzadzenia"
  | "numer_umowy_cesji"
  | "data_umowy_cesji"
  | "planowa_godzina_odlotu"
  | "planowa_godzina_przylotu"
  | "faktyczna_godzina_przylotu"
  | "numer_rezerwacji"
  | "termin_zaplaty"
  | "numer_rachunku_oweme"
  | "tytul_przelewu"
  | "inne_zalaczniki"
  | "data_wygenerowania"
  | "lista_pasazerow"
  | "ADRES_LINII_LOTNICZEJ"
  | "DATA_LOTU"
  | "DATA_SPORZADZENIA"
  | "DATA_UMOWY_CESJI"
  | "DYSTANS_TRASY_KM"
  | "EMAIL_REKLAMACYJNY_LINII"
  | "FAKTYCZNA_GODZINA_PRZYLOTU"
  | "IATA_CODE"
  | "IMIE_NAZWISKO_KLIENTA"
  | "INNE_ZALACZNIKI"
  | "KOD_POCZTOWY_LINII"
  | "KRAJ_SIEDZIBY_LINII"
  | "KWOTA_ODSZKODOWANIA_EUR"
  | "KWOTA_ODSZKODOWANIA_PLN"
  | "MIASTO_LINII"
  | "NAZWA_LINII_LOTNICZEJ"
  | "NR_LOTU"
  | "NR_REZERWACJI"
  | "NUMER_PISMA"
  | "NUMER_RACHUNKU_OWEME"
  | "NUMER_SPRAWY"
  | "NUMER_UMOWY_CESJI"
  | "OKLICZNOSCI_ZDARZENIA"
  | "OKOLICZNOSCI_ZDARZENIA"
  | "PLANOWA_GODZINA_ODLOTU"
  | "PLANOWA_GODZINA_PRZYLOTU"
  | "PORT_ODLOTU_IATA"
  | "PORT_ODLOTU_NAZWA"
  | "PORT_PRZYLOTU_IATA"
  | "PORT_PRZYLOTU_NAZWA"
  | "PROG_ART7"
  | "REJESTR_LINII"
  | "TERMIN_ZAPLATY"
  | "TYP_ZDARZENIA"
  | "TYTUL_PRZELEWU"
  | "WYMIAR_OPOZNIENIA_MINUT";

export type TemplateData = Record<TemplateFieldName, string>;

export class DocumentValidationError extends Error {
  constructor(public readonly missingFields: string[]) {
    super("Brak wymaganych danych do wygenerowania dokumentu.");
    this.name = "DocumentValidationError";
  }
}

export class DocumentTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentTemplateError";
  }
}

export class DocumentTemplateLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentTemplateLoadError";
  }
}

export class DocumentRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentRenderError";
  }
}

const requiredFieldsByDocumentType: Record<DocumentType, Array<keyof TemplateData>> = {
  ASSIGNMENT_AGREEMENT: ["imie", "nazwisko", "numer_sprawy"],
  POWER_OF_ATTORNEY: ["imie", "nazwisko", "numer_sprawy"],
  DEMAND_LETTER: [
    "imie",
    "nazwisko",
    "numer_sprawy",
    "numer_lotu",
    "data_lotu",
    "lotnisko_wylotu",
    "lotnisko_przylotu",
    "kwota_roszczenia",
    "nazwa_linii",
    "opoznienie",
  ],
  NEGATIVE_RESPONSE_REPLY: ["numer_sprawy", "numer_lotu", "nazwa_linii"],
  LAWSUIT: [
    "imie",
    "nazwisko",
    "numer_sprawy",
    "numer_lotu",
    "data_lotu",
    "kwota_roszczenia",
    "nazwa_linii",
  ],
  SETTLEMENT_CONFIRMATION: ["numer_sprawy", "kwota_roszczenia"],
  CLIENT_CONFIRMATION: ["imie", "nazwisko", "numer_sprawy"],
};

const generatedPlaceholder = "GENEROWANE_PRZEZ_BACKEND";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
});

const claimTypeLabels: Record<FullClaim["type"], string> = {
  DELAY: "OPÓŹNIENIE",
  CANCELLATION: "ODWOŁANIE",
  DENIED_BOARDING: "ODMOWA PRZYJĘCIA NA POKŁAD",
};

const amountCategoryArticlePoint: Record<string, string> = {
  EUR_250: "a",
  EUR_400: "b",
  EUR_600: "c",
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date);
}

function formatTime(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);

  return date;
}

function decimalToNumber(
  value: Prisma.Decimal | number | string | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatPlainAmount(
  value: Prisma.Decimal | number | string | null | undefined,
) {
  const numberValue = decimalToNumber(value);

  return numberValue === null ? "" : numberValue.toFixed(2);
}

function formatAmount(value: Prisma.Decimal | number | string | null | undefined) {
  const plainAmount = formatPlainAmount(value);

  return plainAmount ? `${plainAmount} EUR` : "";
}

function buildAddress(claim: FullClaim) {
  return [
    claim.client.address,
    [claim.client.postalCode, claim.client.city].filter(Boolean).join(" "),
    claim.client.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function toPayloadRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function isUsableString(value: unknown) {
  return (
    (typeof value === "string" || typeof value === "number") &&
    String(value).trim().length > 0 &&
    String(value).trim() !== generatedPlaceholder
  );
}

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  return isUsableString(value) ? String(value).trim() : "";
}

function firstValue(...values: Array<string | null | undefined>) {
  return values.find((value) => isUsableString(value))?.trim() ?? "";
}

function extractEmail(value: string | null | undefined) {
  return value?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function buildPassengerList(claim: FullClaim) {
  return claim.passengers
    .map((passenger) => `${passenger.firstName} ${passenger.lastName}`.trim())
    .filter(Boolean)
    .join(", ");
}

function buildIncidentDescription(
  claim: FullClaim,
  delayMinutes: string,
) {
  if (claim.type === "DELAY") {
    return delayMinutes
      ? `Lot dotarł do miejsca docelowego z opóźnieniem ${delayMinutes} minut.`
      : "Lot dotarł do miejsca docelowego z opóźnieniem.";
  }

  if (claim.type === "CANCELLATION") {
    return "Lot został odwołany.";
  }

  return "Pasażerowi odmówiono przyjęcia na pokład.";
}

function buildDistanceKm(
  claim: FullClaim,
  departureAirportCode: string,
  arrivalAirportCode: string,
) {
  if (claim.flight?.distanceKm) {
    return String(claim.flight.distanceKm);
  }

  const departureAirport = findAirport(departureAirportCode);
  const arrivalAirport = findAirport(arrivalAirportCode);

  if (!departureAirport || !arrivalAirport) {
    return "";
  }

  return String(Math.round(distanceKm(departureAirport, arrivalAirport)));
}

function getArticle7Point(
  amountCategory: string,
  distanceValue: string,
  amountValue: string,
) {
  if (amountCategoryArticlePoint[amountCategory]) {
    return amountCategoryArticlePoint[amountCategory];
  }

  const amount = decimalToNumber(amountValue);

  if (amount === 250) return "a";
  if (amount === 400) return "b";
  if (amount === 600) return "c";

  const distance = decimalToNumber(distanceValue);

  if (distance === null) return "";
  if (distance <= 1500) return "a";
  if (distance <= 3500) return "b";

  return "c";
}

function buildPlnAmount(claim: FullClaim, amount: Prisma.Decimal | null) {
  const rate = claim.payouts.find((payout) => payout.eurPlnRate)?.eurPlnRate;
  const amountValue = decimalToNumber(amount);
  const rateValue = decimalToNumber(rate);

  if (amountValue === null || rateValue === null) {
    return "";
  }

  return (amountValue * rateValue).toFixed(2);
}

function createUppercaseAliases(data: Record<string, string>) {
  return {
    ADRES_LINII_LOTNICZEJ: data.adres_linii,
    DATA_LOTU: data.data_lotu,
    DATA_SPORZADZENIA: data.data_sporzadzenia,
    DATA_UMOWY_CESJI: data.data_umowy_cesji,
    DYSTANS_TRASY_KM: data.dystans_trasy_km,
    EMAIL_REKLAMACYJNY_LINII: data.email_reklamacyjny_linii,
    FAKTYCZNA_GODZINA_PRZYLOTU: data.faktyczna_godzina_przylotu,
    IATA_CODE: data.kod_iata_linii,
    IMIE_NAZWISKO_KLIENTA: data.imie_nazwisko,
    INNE_ZALACZNIKI: data.inne_zalaczniki,
    KOD_POCZTOWY_LINII: data.kod_pocztowy_linii,
    KRAJ_SIEDZIBY_LINII: data.kraj_linii,
    KWOTA_ODSZKODOWANIA_EUR: data.kwota_roszczenia_eur,
    KWOTA_ODSZKODOWANIA_PLN: data.kwota_roszczenia_pln,
    MIASTO_LINII: data.miasto_linii,
    NAZWA_LINII_LOTNICZEJ: data.nazwa_linii,
    NR_LOTU: data.numer_lotu,
    NR_REZERWACJI: data.numer_rezerwacji,
    NUMER_PISMA: data.numer_pisma,
    NUMER_RACHUNKU_OWEME: data.numer_rachunku_oweme,
    NUMER_SPRAWY: data.numer_sprawy,
    NUMER_UMOWY_CESJI: data.numer_umowy_cesji,
    OKLICZNOSCI_ZDARZENIA: data.okolicznosci_zdarzenia,
    OKOLICZNOSCI_ZDARZENIA: data.okolicznosci_zdarzenia,
    PLANOWA_GODZINA_ODLOTU: data.planowa_godzina_odlotu,
    PLANOWA_GODZINA_PRZYLOTU: data.planowa_godzina_przylotu,
    PORT_ODLOTU_IATA: data.lotnisko_wylotu,
    PORT_ODLOTU_NAZWA: data.lotnisko_wylotu_nazwa,
    PORT_PRZYLOTU_IATA: data.lotnisko_przylotu,
    PORT_PRZYLOTU_NAZWA: data.lotnisko_przylotu_nazwa,
    PROG_ART7: data.prog_art7,
    REJESTR_LINII: data.rejestr_linii,
    TERMIN_ZAPLATY: data.termin_zaplaty,
    TYP_ZDARZENIA: data.typ_zdarzenia,
    TYTUL_PRZELEWU: data.tytul_przelewu,
    WYMIAR_OPOZNIENIA_MINUT: data.opoznienie_minuty,
  };
}

export function buildTemplateData(claim: FullClaim): TemplateData {
  const airline = claim.airline ?? claim.flight?.airline ?? null;
  const payload = toPayloadRecord(claim.applicationPayload);
  const departureAirportCode = firstValue(
    claim.flight?.departureAirportCode,
    payloadString(payload, "PORT_ODLOTU_IATA"),
  );
  const arrivalAirportCode = firstValue(
    claim.flight?.arrivalAirportCode,
    payloadString(payload, "PORT_PRZYLOTU_IATA"),
  );
  const departureAirport = findAirport(departureAirportCode);
  const arrivalAirport = findAirport(arrivalAirportCode);
  const delayMinutes =
    claim.flight?.delayMinutes !== null && claim.flight?.delayMinutes !== undefined
      ? String(claim.flight.delayMinutes)
      : payloadString(payload, "OPOZNIENIE_MINUTY");
  const distanceValue = firstValue(
    String(claim.flight?.distanceKm ?? ""),
    buildDistanceKm(claim, departureAirportCode, arrivalAirportCode),
    payloadString(payload, "DYSTANS_TRASY_KM"),
  );
  const amount = claim.potentialAmount;
  const amountValue = firstValue(
    formatPlainAmount(amount),
    payloadString(payload, "SZACOWANA_KWOTA_EUR"),
    payloadString(payload, "KWOTA_ODSZKODOWANIA_EUR"),
  );
  const amountCategory = claim.flight?.amountCategory ?? "";
  const incidentDescription = firstValue(
    payloadString(payload, "OKOLICZNOSCI_ZDARZENIA"),
    payloadString(payload, "OKLICZNOSCI_ZDARZENIA"),
    buildIncidentDescription(claim, delayMinutes),
  );
  const airlineContactInfo = airline?.contactInfo ?? "";
  const generatedAt = new Date();
  const baseData = {
    imie: claim.client.firstName,
    nazwisko: claim.client.lastName,
    imie_nazwisko: `${claim.client.firstName} ${claim.client.lastName}`.trim(),
    adres: buildAddress(claim),
    email: claim.client.email,
    telefon: claim.client.phoneFormatted ?? claim.client.phone ?? "",
    pesel_nip: firstValue(
      claim.client.pesel,
      payloadString(payload, "PESEL_NIP_KLIENTA"),
    ),
    numer_dokumentu: firstValue(
      claim.client.documentNumber,
      claim.client.idDocumentNumber,
      payloadString(payload, "NR_DOK_TOZSAMOSCI"),
    ),
    numer_sprawy: claim.claimNumber,
    numer_lotu: firstValue(claim.flight?.flightNumber, payloadString(payload, "NR_LOTU")),
    data_lotu: firstValue(
      formatDate(claim.flight?.flightDate ?? claim.flightDate),
      formatDate(payloadString(payload, "DATA_LOTU")),
    ),
    lotnisko_wylotu: departureAirportCode,
    lotnisko_przylotu: arrivalAirportCode,
    lotnisko_wylotu_nazwa: departureAirport?.name ?? "",
    lotnisko_przylotu_nazwa: arrivalAirport?.name ?? "",
    kwota_roszczenia: formatAmount(claim.potentialAmount),
    kwota_roszczenia_eur: amountValue,
    kwota_roszczenia_pln: firstValue(
      payloadString(payload, "KWOTA_ODSZKODOWANIA_PLN"),
      buildPlnAmount(claim, amount),
    ),
    nazwa_linii: firstValue(
      payloadString(payload, "NAZWA_LINII_LOTNICZEJ"),
      airline?.legalName,
      airline?.name,
    ),
    kod_iata_linii: firstValue(payloadString(payload, "IATA_CODE"), airline?.iataCode),
    adres_linii: firstValue(
      payloadString(payload, "ADRES_LINII_LOTNICZEJ"),
      airline?.addressLine,
      airline?.correspondenceAddress,
    ),
    kod_pocztowy_linii: firstValue(
      payloadString(payload, "KOD_POCZTOWY_LINII"),
      airline?.postalCode,
    ),
    miasto_linii: firstValue(payloadString(payload, "MIASTO_LINII"), airline?.city),
    kraj_linii: firstValue(
      payloadString(payload, "KRAJ_SIEDZIBY_LINII"),
      airline?.country,
    ),
    email_reklamacyjny_linii: firstValue(
      payloadString(payload, "EMAIL_REKLAMACYJNY_LINII"),
      airline?.complaintEmail,
      extractEmail(airlineContactInfo),
    ),
    rejestr_linii: firstValue(
      payloadString(payload, "REJESTR_LINII"),
      airline?.registryInfo,
    ),
    opoznienie: delayMinutes ? `${delayMinutes} min` : "",
    opoznienie_minuty: delayMinutes,
    dystans_trasy_km: distanceValue,
    kategoria_kwoty: amountCategory,
    prog_art7: getArticle7Point(amountCategory, distanceValue, amountValue),
    typ_zdarzenia: claimTypeLabels[claim.type],
    okolicznosci_zdarzenia: incidentDescription,
    numer_pisma: firstValue(payloadString(payload, "NUMER_PISMA"), claim.claimNumber),
    data_sporzadzenia: formatDate(generatedAt),
    numer_umowy_cesji: firstValue(
      payloadString(payload, "NUMER_UMOWY_CESJI"),
      claim.claimNumber,
    ),
    data_umowy_cesji: firstValue(
      formatDate(payloadString(payload, "DATA_UMOWY_CESJI")),
      formatDate(claim.createdAt),
    ),
    planowa_godzina_odlotu: formatTime(claim.flight?.scheduledDeparture),
    planowa_godzina_przylotu: formatTime(claim.flight?.scheduledArrival),
    faktyczna_godzina_przylotu: formatTime(claim.flight?.actualArrival),
    numer_rezerwacji: payloadString(payload, "NR_REZERWACJI"),
    termin_zaplaty: formatDate(addDays(generatedAt, 14)),
    numer_rachunku_oweme: process.env.OWEME_BANK_ACCOUNT ?? "",
    tytul_przelewu: firstValue(
      claim.transferTitle,
      payloadString(payload, "TYTUL_PRZELEWU"),
      `Odszkodowanie EC261 ${claim.claimNumber}`,
    ),
    inne_zalaczniki: payloadString(payload, "INNE_ZALACZNIKI"),
    data_wygenerowania: formatDate(generatedAt),
    lista_pasazerow: buildPassengerList(claim),
  };

  return {
    ...baseData,
    ...createUppercaseAliases(baseData),
  };
}

export function validateTemplateData(
  data: TemplateData,
  documentType: DocumentType,
) {
  return requiredFieldsByDocumentType[documentType].filter(
    (field) => !data[field]?.trim(),
  );
}

function createFallbackTemplateBuffer(documentType: DocumentType) {
  const zip = new PizZip();
  const body = [
    `OWEME - ${documentType}`,
    "Sprawa: {numer_sprawy}",
    "Klient: {imie} {nazwisko}",
    "Adres: {adres}",
    "Lot: {numer_lotu}, {data_lotu}, {lotnisko_wylotu} - {lotnisko_przylotu}",
    "Linia: {nazwa_linii}",
    "Kwota: {kwota_roszczenia}",
    "Opóźnienie: {opoznienie}",
    "Kategoria kwoty: {kategoria_kwoty}",
    "Pasażerowie: {lista_pasazerow}",
    "Data wygenerowania: {data_wygenerowania}",
  ]
    .map(
      (line) =>
        `<w:p><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`,
    )
    .join("");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.folder("word")?.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`,
  );

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

async function loadTemplateBuffer(documentType: DocumentType) {
  const templatePath = path.join(
    process.cwd(),
    "lib",
    "documents",
    "templates",
    `${documentType}.docx`,
  );

  try {
    return await readFile(templatePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      console.warn(
        `[Documents] Nie znaleziono szablonu ${documentType}.docx. Używam wbudowanego fallbacku DOCX.`,
      );
      return createFallbackTemplateBuffer(documentType);
    }

    throw new DocumentTemplateLoadError(
      `Nie udało się wczytać szablonu DOCX dla typu ${documentType}.`,
    );
  }
}

function templateUsesGuillemetDelimiters(zip: PizZip) {
  return Object.keys(zip.files).some((fileName) => {
    if (!fileName.startsWith("word/") || !fileName.endsWith(".xml")) {
      return false;
    }

    const file = zip.file(fileName);

    return file ? file.asText().includes("\u00ab") : false;
  });
}

function createDocxtemplater(zip: PizZip) {
  const options: Docxtemplater.DXT.Options = {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  };

  if (templateUsesGuillemetDelimiters(zip)) {
    options.delimiters = {
      start: "\u00ab",
      end: "\u00bb",
    };
  }

  return new Docxtemplater(zip, options);
}

export async function generateDocument(
  claim: FullClaim,
  documentType: DocumentType,
) {
  const template = await loadTemplateBuffer(documentType);
  const data = buildTemplateData(claim);

  try {
    const zip = new PizZip(template);
    const doc = createDocxtemplater(zip);

    doc.render(data);

    return doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }) as Buffer;
  } catch (error) {
    throw new DocumentRenderError(
      error instanceof Error
        ? error.message
        : "Nie udało się wyrenderować szablonu DOCX.",
    );
  }
}

export async function generateAndStore(
  claim: FullClaim,
  documentType: DocumentType,
  generatedById: string,
) {
  const templateData = buildTemplateData(claim);
  const missingFields = validateTemplateData(templateData, documentType);

  if (missingFields.length) {
    throw new DocumentValidationError(missingFields);
  }

  const latestDocument = await prisma.document.findFirst({
    where: {
      claimId: claim.id,
      type: documentType,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      version: true,
    },
  });
  const version = (latestDocument?.version ?? 0) + 1;
  const buffer = await generateDocument(claim, documentType);
  const storageKey = getDocumentStorageKey(claim.id, documentType, version);
  const fileName = `${claim.claimNumber}-${documentType}-v${version}.docx`;

  const uploadResult = await uploadObject({
    key: storageKey,
    body: buffer,
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    allowDevelopmentLocalFallback: true,
  });

  const [document] = await prisma.$transaction([
    prisma.document.create({
      data: {
        claimId: claim.id,
        generatedById,
        type: documentType,
        fileName,
        version,
        storageKey: uploadResult.storageKey,
      },
    }),
    prisma.note.create({
      data: {
        claimId: claim.id,
        authorId: generatedById,
        type: NoteType.INTERNAL,
        content:
          uploadResult.backend === "local-dev"
            ? `Wygenerowano dokument lokalnie (dev fallback): ${documentType} v${version}`
            : `Wygenerowano dokument: ${documentType} v${version}`,
      },
    }),
  ]);

  return document;
}
