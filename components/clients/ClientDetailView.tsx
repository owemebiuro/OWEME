"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClaimStatusBadge, ClaimTypeBadge } from "@/components/claims/ClaimStatusBadge";
import { ClientEditModal } from "@/components/clients/ClientEditModal";
import type { ClientDetailData } from "@/lib/clients/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/claims/format";
import { api } from "@/lib/trpc/hooks";

type ClientDetailViewProps = {
  client: ClientDetailData;
};

function DataTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-neutral-950">{value}</div>
    </div>
  );
}

export function ClientDetailView({ client }: ClientDetailViewProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isEditOpen, setIsEditOpen] = useState(false);

  function refreshClient() {
    void utils.clients.getById.invalidate({ id: client.id });
    router.refresh();
  }

  const fullAddress = [
    client.address,
    [client.postalCode, client.city].filter(Boolean).join(" "),
    client.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">Klient CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            {client.firstName} {client.lastName}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Ostatnia aktualizacja: {formatDateTime(client.updatedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="h-11 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Edytuj dane
        </button>
      </header>

      <section className="grid gap-4 py-6 md:grid-cols-2 xl:grid-cols-4">
        <DataTile
          label="Email"
          value={
            <a className="underline-offset-4 hover:underline" href={`mailto:${client.email}`}>
              {client.email}
            </a>
          }
        />
        <DataTile
          label="Telefon"
          value={
            client.phone ? (
              <a className="underline-offset-4 hover:underline" href={`tel:${client.phone}`}>
                {client.phone}
              </a>
            ) : (
              "Brak"
            )
          }
        />
        <DataTile label="Adres" value={fullAddress || "Brak adresu"} />
        <DataTile label="Sprawy" value={client.claimsCount} />
        <DataTile label="Narodowość" value={client.nationality ?? "Brak"} />
        <DataTile
          label="Dokument"
          value={client.idDocumentNumber ?? "Brak"}
        />
        <DataTile label="Status" value={client.status} />
        <DataTile label="Utworzono" value={formatDate(client.createdAt)} />
      </section>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-4">
          <h2 className="text-base font-semibold text-neutral-950">
            Historia spraw klienta
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Wszystkie sprawy powiązane z tym klientem.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Numer</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">Linia</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Kwota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {client.claims.length ? (
                client.claims.map((claim) => (
                  <tr key={claim.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/crm/claims/${claim.id}`}
                        className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                      >
                        {claim.claimNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <ClaimTypeBadge type={claim.type} />
                    </td>
                    <td className="px-4 py-4">
                      <ClaimStatusBadge status={claim.status} />
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {claim.flight
                        ? `${claim.flight.flightNumber}, ${formatDate(claim.flight.flightDate)}`
                        : "Brak lotu"}
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {claim.airline
                        ? `${claim.airline.name} (${claim.airline.iataCode})`
                        : "Brak linii"}
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-neutral-950">
                      {formatCurrency(claim.potentialAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="font-semibold text-neutral-950">
                      Ten klient nie ma jeszcze spraw.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ClientEditModal
        client={client}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={refreshClient}
      />
    </div>
  );
}
