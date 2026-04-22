import type { Metadata } from "next";

import { ClaimsTable } from "@/components/claims/ClaimsTable";
import { requireAuth } from "@/lib/auth-helpers";
import type {
  ClaimsListData,
  ClaimsListItem,
} from "@/lib/claims/types";
import {
  parseClaimsListInput,
  type ClaimsRouteSearchParams,
} from "@/lib/claims/url-filters";
import { createTRPCCaller } from "@/lib/trpc/server";

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

type RawClaimListItem = Omit<
  ClaimsListItem,
  "createdAt" | "potentialAmount" | "flight"
> & {
  createdAt: RawDate;
  potentialAmount: RawDecimal;
  flight: RawClaimFlight | null;
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
      ...claim,
      potentialAmount: claim.potentialAmount?.toString() ?? null,
      createdAt: serializeDate(claim.createdAt),
      flight: claim.flight
        ? {
            ...claim.flight,
            flightDate: serializeDate(claim.flight.flightDate),
          }
        : null,
    })),
  };
}

function AppUserMissingState({ email }: { email: string | undefined }) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-700">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Brak użytkownika aplikacyjnego
        </h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">
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
  const trpc = await createTRPCCaller();
  const [claims, owners] = await Promise.all([
    trpc.claims.list(listInput),
    trpc.users.listActive(),
  ]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <ClaimsTable
          data={serializeClaimsList(claims)}
          owners={owners}
          currentUser={currentUser.appUser}
        />
      </div>
    </main>
  );
}
