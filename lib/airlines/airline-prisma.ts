import { getAirlineCrmDataByIata } from "./airline-crm-data";

type AirlinePrismaData = {
  name: string;
  legalName?: string | null;
  country?: string | null;
  carrierType?: string | null;
  correspondenceAddress?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  registryInfo?: string | null;
  complaintEmail?: string | null;
  operationalNotes?: string | null;
};

function optionalString(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function getAirlinePrismaData(
  iataCode: string | null | undefined,
  fallbackName?: string | null,
): AirlinePrismaData {
  const airline = getAirlineCrmDataByIata(iataCode);

  if (!airline) {
    return {
      name: optionalString(fallbackName) ?? "Nieznana linia",
    };
  }

  return {
    name: airline.name,
    legalName: airline.legalName,
    country: airline.country,
    carrierType: "COMMERCIAL",
    correspondenceAddress: airline.correspondenceAddress,
    addressLine: optionalString(airline.addressLine),
    postalCode: optionalString(airline.postalCode),
    city: optionalString(airline.city),
    registryInfo: optionalString(airline.registryInfo),
    complaintEmail: optionalString(airline.complaintEmail),
    operationalNotes: optionalString(airline.operationalNotes),
  };
}
