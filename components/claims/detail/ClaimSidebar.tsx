"use client";

import Link from "next/link";
import { useState } from "react";

import { LimitationBadge } from "@/components/LimitationBadge/LimitationBadge";
import type { ClaimDetailData } from "@/lib/claims/detail-types";
import {
  apiDataSourceLabels,
  flightStatusLabels,
  settlementStatusLabels,
} from "@/lib/claims/detail-labels";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/claims/format";
import { computeLimitation, extractComplaintDates } from "@/lib/limitation/limitation";
import { api } from "@/lib/trpc/hooks";

type ClaimSidebarProps = {
  claim: ClaimDetailData;
  onChanged?: () => void;
};

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-neutral-950">{value}</div>
    </div>
  );
}

export function ClaimSidebar({ claim, onChanged }: ClaimSidebarProps) {
  const previousClaims = Math.max(0, claim.client.claimsCount - 1);
  const payout = claim.payouts[0];
  const { complaintFiledAt, complaintAnsweredAt } = extractComplaintDates(
    claim.statusHistory.map((entry) => ({
      status: entry.newStatus,
      createdAt: new Date(entry.createdAt),
    })),
  );
  const limitation = computeLimitation(
    new Date(claim.flight?.flightDate ?? claim.createdAt),
    complaintFiledAt,
    complaintAnsweredAt,
  );
  const address = [
    claim.client.address,
    [claim.client.postalCode, claim.client.city].filter(Boolean).join(" "),
    claim.client.country,
  ]
    .filter(Boolean)
    .join(", ");
  const [refreshFeedback, setRefreshFeedback] = useState<string | null>(null);
  const refreshFlight = api.flights.refresh.useMutation({
    onSuccess: (result) => {
      setRefreshFeedback(
        result.error ??
          result.warnings[0] ??
          "Dane lotu zostały odświeżone.",
      );
      onChanged?.();
    },
    onError: (error) => {
      setRefreshFeedback(
        error.message || "Nie udało się odświeżyć danych lotu.",
      );
    },
  });

  function handleFlightRefresh() {
    if (!claim.flight || refreshFlight.isPending) {
      return;
    }

    setRefreshFeedback(null);
    refreshFlight.mutate({
      flightId: claim.flight.id,
    });
  }

  return (
    <aside className="space-y-4">
      <SidebarSection title="Klient">
        <DataRow
          label="Imię i nazwisko"
          value={
            <Link
              href={`/crm/clients/${claim.client.id}`}
              className="underline-offset-4 hover:underline"
            >
              {claim.client.firstName} {claim.client.lastName}
            </Link>
          }
        />
        <DataRow
          label="Email"
          value={
            <a
              href={`mailto:${claim.client.email}`}
              className="underline-offset-4 hover:underline"
            >
              {claim.client.email}
            </a>
          }
        />
        <DataRow
          label="Telefon"
          value={
            claim.client.phone ? (
              <a
                href={`tel:${claim.client.phone}`}
                className="underline-offset-4 hover:underline"
              >
                {claim.client.phone}
              </a>
            ) : (
              "Brak telefonu"
            )
          }
        />
        <DataRow label="Adres" value={address || "Brak adresu"} />
        <DataRow
          label="Poprzednie sprawy"
          value={`${previousClaims} w CRM`}
        />
      </SidebarSection>

      <SidebarSection title="Lot">
        {claim.flight ? (
          <>
            <DataRow label="Numer lotu" value={claim.flight.flightNumber} />
            <DataRow label="Data lotu" value={formatDate(claim.flight.flightDate)} />
            <DataRow
              label="Trasa"
              value={`${claim.flight.departureAirportCode} → ${claim.flight.arrivalAirportCode}`}
            />
            <DataRow
              label="Linia lotnicza"
              value={claim.airline?.name ?? "Brak linii"}
            />
            <DataRow
              label="Opóźnienie"
              value={
                <span
                  className={
                    claim.flight.delayMinutes !== null &&
                    claim.flight.delayMinutes >= 180
                      ? "font-semibold text-red-700"
                      : ""
                  }
                >
                  {claim.flight.delayMinutes !== null
                    ? `${claim.flight.delayMinutes} min`
                    : "Nieznane"}
                </span>
              }
            />
            <DataRow
              label="Status lotu"
              value={
                <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-semibold text-neutral-700">
                  {flightStatusLabels[claim.flight.flightStatus]}
                </span>
              }
            />
            <DataRow
              label="Źródło danych"
              value={apiDataSourceLabels[claim.flight.dataSource]}
            />
            <DataRow
              label="Ostatnie odświeżenie"
              value={formatDateTime(claim.flight.lastApiRefreshAt)}
            />
            <button
              type="button"
              onClick={handleFlightRefresh}
              disabled={refreshFlight.isPending}
              className="h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
            >
              {refreshFlight.isPending
                ? "Odświeżam dane lotu..."
                : "Odśwież dane lotu"}
            </button>
            {refreshFeedback ? (
              <p className="text-xs text-neutral-500">{refreshFeedback}</p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-neutral-500">Brak przypisanego lotu.</p>
        )}
      </SidebarSection>

      <LimitationBadge data={limitation} variant="full" />

      {payout ? (
        <SidebarSection title="Rozliczenie">
          <DataRow
            label="Kwota odzyskana"
            value={formatCurrency(payout.amountRecovered, payout.currency)}
          />
          <DataRow
            label="Prowizja OWEME"
            value={formatCurrency(payout.owemeFee, payout.currency)}
          />
          <DataRow
            label="Dla klienta"
            value={formatCurrency(payout.clientAmount, payout.currency)}
          />
          <DataRow
            label="Status"
            value={settlementStatusLabels[payout.status]}
          />
          <DataRow label="Data rozliczenia" value={formatDate(payout.receivedAt)} />
        </SidebarSection>
      ) : null}
    </aside>
  );
}
