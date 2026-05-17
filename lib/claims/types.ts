import type { ClaimSource, ClaimStatus, ClaimType, UserRole } from "@prisma/client";

export type ClaimsListItem = {
  id: string;
  claimNumber: string;
  type: ClaimType;
  source: ClaimSource;
  status: ClaimStatus;
  ownerId: string | null;
  potentialAmount: string | null;
  signatureFirst: string | null;
  signatureSecond: string | null;
  courtName: string | null;
  isCourtStage: boolean;
  createdAt: string;
  statusHistory: Array<{
    id: string;
    newStatus: ClaimStatus;
    createdAt: string;
  }>;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  flight: {
    id: string;
    flightNumber: string;
    flightDate: string;
    departureAirportCode: string;
    arrivalAirportCode: string;
  } | null;
  airline: {
    id: string;
    name: string;
    iataCode: string;
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type ClaimsListData = {
  items: ClaimsListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ClaimsOwnerOption = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ClaimsCurrentUser = ClaimsOwnerOption;
