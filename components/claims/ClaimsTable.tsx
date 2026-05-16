"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ClaimStatusBadge,
  ClaimTypeBadge,
} from "@/components/claims/ClaimStatusBadge";
import { LimitationBadge } from "@/components/LimitationBadge/LimitationBadge";
import { ClaimsFilters } from "@/components/claims/ClaimsFilters";
import { ClaimsPagination } from "@/components/claims/ClaimsPagination";
import { ClaimsSavedViews } from "@/components/claims/ClaimsSavedViews";
import { QuickActions } from "@/components/claims/QuickActions";
import { computeLimitation, extractComplaintDates } from "@/lib/limitation/limitation";
import type {
  ClaimsCurrentUser,
  ClaimsListData,
  ClaimsListItem,
} from "@/lib/claims/types";

type ClaimsTableProps = {
  data: ClaimsListData;
  currentUser: ClaimsCurrentUser;
  archived?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Brak daty";
  }

  return dateFormatter.format(new Date(value));
}

function formatAmount(value: string | null) {
  if (!value) {
    return "Nie wyliczono";
  }

  return currencyFormatter.format(Number(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function computeClaimLimitation(claim: ClaimsListItem) {
  const flightDate = new Date(claim.flight?.flightDate ?? claim.createdAt);
  const { complaintFiledAt, complaintAnsweredAt } = extractComplaintDates(
    claim.statusHistory.map((entry) => ({
      status: entry.newStatus,
      createdAt: new Date(entry.createdAt),
    })),
  );

  return computeLimitation(flightDate, complaintFiledAt, complaintAnsweredAt);
}

export function ClaimsTable({ data, currentUser, archived = false }: ClaimsTableProps) {
  const searchParams = useSearchParams();
  const isJudicialView = searchParams.get("view") === "judicial";
  const tableClassName = isJudicialView
    ? "w-full min-w-[2250px] table-fixed border-collapse text-left"
    : "w-full min-w-[1910px] table-fixed border-collapse text-left";

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            {archived ? "Archiwum spraw" : "Sprawy"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            {archived
              ? "Sprawy zakończone — wygrania, ugody, odrzucenia i zamknięcia."
              : "Szybka lista operacyjna do weryfikacji, przypisań i zmian statusów."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-950">{data.total}</span>
          spraw w bieżącym widoku
        </div>
      </header>

      {!archived && <ClaimsSavedViews currentUserId={currentUser.id} />}
      <ClaimsFilters />

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className={tableClassName}>
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="w-[130px] px-4 py-3">Numer</th>
                <th className="w-[210px] px-4 py-3">Klient</th>
                <th className="w-[170px] px-4 py-3">Lot</th>
                <th className="w-[170px] px-4 py-3">Linia</th>
                <th className="w-[110px] px-4 py-3">Typ</th>
                <th className="w-[170px] px-4 py-3">Status</th>
                <th className="w-[330px] px-4 py-3">Przedawnienie</th>
                {isJudicialView ? (
                  <>
                    <th className="w-[150px] px-4 py-3">Sygnatura I</th>
                    <th className="w-[12%] px-4 py-3">Sąd</th>
                  </>
                ) : null}
                <th className="w-[100px] px-4 py-3">Kwota</th>
                <th className="w-[230px] px-4 py-3">Pracownik</th>
                <th className="w-[130px] px-4 py-3">Utworzono</th>
                <th className="w-[160px] px-4 py-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {data.items.length ? (
                data.items.map((claim) => {
                  const limitation = computeClaimLimitation(claim);

                  return (
                  <tr
                    key={claim.id}
                    className="align-top transition hover:bg-neutral-50"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/crm/claims/${claim.id}`}
                        className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                      >
                        {claim.claimNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-neutral-950">
                        {claim.client.firstName} {claim.client.lastName}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {claim.client.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {claim.flight ? (
                        <>
                          <p className="font-semibold text-neutral-950">
                            {claim.flight.flightNumber}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {claim.flight.departureAirportCode} →{" "}
                            {claim.flight.arrivalAirportCode},{" "}
                            {formatDate(claim.flight.flightDate)}
                          </p>
                        </>
                      ) : (
                        <span className="text-neutral-400">Brak lotu</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {claim.airline ? (
                        <>
                          <p className="font-semibold text-neutral-950">
                            {claim.airline.name}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            IATA {claim.airline.iataCode}
                          </p>
                        </>
                      ) : (
                        <span className="text-neutral-400">Brak linii</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <ClaimTypeBadge type={claim.type} />
                    </td>
                    <td className="max-w-[160px] overflow-hidden px-4 py-4">
                      <span title={claim.status} className="block truncate">
                        <ClaimStatusBadge status={claim.status} />
                      </span>
                    </td>
                    <td className="overflow-hidden px-4 py-4">
                      <LimitationBadge data={limitation} variant="compact" />
                    </td>
                    {isJudicialView ? (
                      <>
                        <td className="truncate px-4 py-4 text-neutral-600">
                          {claim.signatureFirst ?? "Brak"}
                        </td>
                        <td className="truncate px-4 py-4 text-neutral-600">
                          {claim.courtName ?? "Brak"}
                        </td>
                      </>
                    ) : null}
                    <td className="px-4 py-4 font-semibold text-neutral-950">
                      {formatAmount(claim.potentialAmount)}
                    </td>
                    <td className="px-4 py-4">
                      {claim.owner ? (
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                            {initials(claim.owner.name)}
                          </span>
                          <div>
                            <p className="font-semibold text-neutral-950">
                              {claim.owner.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {claim.owner.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-md border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] px-2 py-1 text-xs font-semibold text-[var(--ember-lo)]">
                          Nieprzypisana
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <QuickActions claim={claim} currentUser={currentUser} />
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isJudicialView ? 13 : 11}
                    className="px-4 py-14 text-center"
                  >
                    <p className="text-base font-semibold text-neutral-950">
                      Brak spraw w tym widoku
                    </p>
                    <p className="mt-2 text-sm text-neutral-500">
                      Zmień filtry albo wybierz inny zapisany widok.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ClaimsPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
        />
      </section>
    </div>
  );
}
