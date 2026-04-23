import { readFile } from "node:fs/promises";
import path from "node:path";

import { DocumentType, NoteType, Prisma } from "@prisma/client";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

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

export type TemplateData = Record<
  | "imie"
  | "nazwisko"
  | "adres"
  | "numer_sprawy"
  | "numer_lotu"
  | "data_lotu"
  | "lotnisko_wylotu"
  | "lotnisko_przylotu"
  | "kwota_roszczenia"
  | "nazwa_linii"
  | "opoznienie"
  | "kategoria_kwoty"
  | "data_wygenerowania"
  | "lista_pasazerow",
  string
>;

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

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleDateString("pl-PL") : "";
}

function formatAmount(value: Prisma.Decimal | null | undefined) {
  return value ? `${value.toFixed(2)} EUR` : "";
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

export function buildTemplateData(claim: FullClaim): TemplateData {
  const airline = claim.airline ?? claim.flight?.airline ?? null;

  return {
    imie: claim.client.firstName,
    nazwisko: claim.client.lastName,
    adres: buildAddress(claim),
    numer_sprawy: claim.claimNumber,
    numer_lotu: claim.flight?.flightNumber ?? "",
    data_lotu: formatDate(claim.flight?.flightDate),
    lotnisko_wylotu: claim.flight?.departureAirportCode ?? "",
    lotnisko_przylotu: claim.flight?.arrivalAirportCode ?? "",
    kwota_roszczenia: formatAmount(claim.potentialAmount),
    nazwa_linii: airline?.name ?? "",
    opoznienie:
      claim.flight?.delayMinutes !== null && claim.flight?.delayMinutes !== undefined
        ? `${claim.flight.delayMinutes} min`
        : "",
    kategoria_kwoty: claim.flight?.amountCategory ?? "",
    data_wygenerowania: new Date().toLocaleDateString("pl-PL"),
    lista_pasazerow: claim.passengers
      .map((passenger) => `${passenger.firstName} ${passenger.lastName}`)
      .join(", "),
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
  } catch {
    return createFallbackTemplateBuffer(documentType);
  }
}

export async function generateDocument(
  claim: FullClaim,
  documentType: DocumentType,
) {
  const template = await loadTemplateBuffer(documentType);
  const data = buildTemplateData(claim);

  try {
    const zip = new PizZip(template);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    return doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }) as Buffer;
  } catch (error) {
    throw new DocumentTemplateError(
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

  await uploadObject({
    key: storageKey,
    body: buffer,
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const [document] = await prisma.$transaction([
    prisma.document.create({
      data: {
        claimId: claim.id,
        generatedById,
        type: documentType,
        fileName,
        version,
        storageKey,
      },
    }),
    prisma.note.create({
      data: {
        claimId: claim.id,
        authorId: generatedById,
        type: NoteType.INTERNAL,
        content: `Wygenerowano dokument: ${documentType} v${version}`,
      },
    }),
  ]);

  return document;
}
