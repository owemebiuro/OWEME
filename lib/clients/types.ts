import type { ClaimStatus, ClaimType } from "@prisma/client";

export type ClientListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  pesel: string | null;
  city: string | null;
  country: string;
  countryCode: string | null;
  status: string;
  createdAt: string;
  claimsCount: number;
};

export type ClientsListData = {
  items: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ClientClaimSummary = {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  type: ClaimType;
  createdAt: string;
  potentialAmount: string | null;
  airline: {
    name: string;
    iataCode: string;
  } | null;
  flight: {
    flightNumber: string;
    flightDate: string;
  } | null;
};

export type ClientDetailData = ClientListItem & {
  nationality: string | null;
  address: string | null;
  postalCode: string | null;
  pesel: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentSeries: string | null;
  countryCode: string | null;
  idDocumentNumber: string | null;
  updatedAt: string;
  claims: ClientClaimSummary[];
};

export type ClientFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  pesel: string | null;
  nationality: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  countryCode: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentSeries: string | null;
  idDocumentNumber: string | null;
  status: string;
};
