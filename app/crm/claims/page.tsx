import type { Metadata } from "next";
import { ClaimStatus } from "@prisma/client";

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

const operationalStatuses = Object.values(ClaimStatus).filter(
  (status) =>
    status !== ClaimStatus.AWAITING_VERIFICATION &&
    status !== ClaimStatus.WON &&
    status !== ClaimStatus.SETTLEMENT &&
    status !== ClaimStatus.CLOSED_PAID &&
    status !== ClaimStatus.REJECTED &&
    status !== ClaimStatus.DISMISSED,
);

export const metadata: Metadata = {
  title: "Sprawy | OWEME CRM",
};

type ClaimsPageProps = {
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
      signatureSecond: claim.signatureSecond,
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

function AppUserMissingState({ email }: { email: string | undefined }) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] p-6">
        <p className="text-sm font-semibold text-[var(--ember-lo)]">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Brak użytkownika aplikacyjnego
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ember-lo)]">
          Sesja Supabase jest aktywna{email ? ` dla ${email}` : ""}, ale nie ma
          jeszcze powiązanego rekordu w tabeli użytkowników aplikacyjnych CRM.
          Utwórz lub zseeduj użytkownika aplikacyjnego i połącz go przez email
          albo `authUserId`.
        </p>
      </div>
    </main>
  );
}

export default async function ClaimsPage({ searchParams }: ClaimsPageProps) {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  const params = await searchParams;
  const listInput = parseClaimsListInput(params);
  const effectiveListInput =
    listInput.status === undefined
      ? { ...listInput, status: operationalStatuses }
      : listInput;
  const trpc = await createTRPCCaller();
  let claims: RawClaimsListData;

  try {
    claims = await trpc.claims.list(effectiveListInput);
  } catch (error) {
    if (isSchemaOutdatedError(error)) {
      return <SchemaMismatchState area="listy spraw" />;
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <ClaimsTable
          data={serializeClaimsList(claims)}
          currentUser={currentUser.appUser}
        />
      </div>
    </main>
  );
}
