import type { Metadata } from "next";

import { SchemaMismatchState } from "@/components/crm/SchemaMismatchState";
import { ClaimsTable } from "@/components/claims/ClaimsTable";
import { requireAuth } from "@/lib/auth-helpers";
import type {
  ClaimsListData,
  ClaimsListItem,
} from "@/lib/claims/types";
import { isSchemaOutdatedError } from "@/lib/prisma-errors";
import {
  parseClaimsListInput,
  type ClaimsRouteSearchParams,
} from "@/lib/claims/url-filters";
import { createTRPCCaller } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "Archiwum spraw | OWEME CRM",
};

type ArchivedClaimsPageProps = {
  searchParams: Promise<ClaimsRouteSearchParams>;
};

type RawDate = Date | string;
type RawDecimal = { toString(): string } | number | string | null;

type RawClaimFlight = {
  id: string;
  flightNumber: string;
  flightDate: RawDate;
  departureAirportCode: string;
  arrivalAirportCode: string;
};

type RawClaimStatusHistory = {
  id: string;
  newStatus: ClaimsListItem["status"];
  createdAt: RawDate;
};

type RawClaimListItem = Omit<
  ClaimsListItem,
  "createdAt" | "potentialAmount" | "flight" | "statusHistory"
> & {
  createdAt: RawDate;
  potentialAmount: RawDecimal;
  flight: RawClaimFlight | null;
  statusHistory: RawClaimStatusHistory[];
};

type RawClaimsListData = Omit<ClaimsListData, "items"> & {
  items: RawClaimListItem[];
};

function serializeDate(value: RawDate) {
  return value instanceof Date ? value.toISOString() : value;
}

function serializeClaimsList(data: RawClaimsListData): ClaimsListData {
  return {
    ...data,
    items: data.items.map((claim) => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      type: claim.type,
      source: claim.source,
      status: claim.status,
      ownerId: claim.ownerId,
      potentialAmount: claim.potentialAmount?.toString() ?? null,
      signatureFirst: claim.signatureFirst,
      courtName: claim.courtName,
      isCourtStage: claim.isCourtStage,
      createdAt: serializeDate(claim.createdAt),
      statusHistory: claim.statusHistory.map((entry) => ({
        id: entry.id,
        newStatus: entry.newStatus,
        createdAt: serializeDate(entry.createdAt),
      })),
      client: claim.client,
      flight: claim.flight
        ? {
            id: claim.flight.id,
            flightNumber: claim.flight.flightNumber,
            flightDate: serializeDate(claim.flight.flightDate),
            departureAirportCode: claim.flight.departureAirportCode,
            arrivalAirportCode: claim.flight.arrivalAirportCode,
          }
        : null,
      airline: claim.airline,
      owner: claim.owner,
    })),
  };
}

export default async function ArchivedClaimsPage({ searchParams }: ArchivedClaimsPageProps) {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return null;
  }

  const params = await searchParams;
  const listInput = { ...parseClaimsListInput(params), archived: true };
  const trpc = await createTRPCCaller();
  let claims: RawClaimsListData;

  try {
    claims = await trpc.claims.list(listInput);
  } catch (error) {
    if (isSchemaOutdatedError(error)) {
      return <SchemaMismatchState area="archiwum spraw" />;
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <ClaimsTable
          data={serializeClaimsList(claims)}
          currentUser={currentUser.appUser}
          archived
        />
      </div>
    </main>
  );
}
