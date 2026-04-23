import type { ClaimStatus, ClaimType } from "@prisma/client";

export type ClientListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string;
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
  idDocumentNumber: string | null;
  updatedAt: string;
  claims: ClientClaimSummary[];
};

export type ClientFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  idDocumentNumber: string | null;
  status: string;
};
