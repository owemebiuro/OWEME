import { LeadStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { requireAuth } from "@/lib/auth-helpers";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";

export const metadata: Metadata = {
  title: "Leady | OWEME CRM",
};

const statusLabels = {
  NEW: "Nowy",
  CONTACTED: "Kontakt",
  CONVERTED: "Skonwertowany",
  LOST: "Utracony",
} as const;

function formatDate(value: Date | null) {
  if (!value) {
    return "Brak";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function reasonFromDisruption(value: string | null) {
  if (value === "cancel") return "CANCELLATION";
  if (value === "denied") return "DENIED_BOARDING";
  return "DELAY";
}

function delayMinutesFromLead(value: string | null) {
  if (value === "3plus") return "180";
  if (value === "less3") return "120";
  return "";
}

function applicationHref(lead: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneFormatted: string | null;
  phone: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  flightDate: Date | null;
  airlineName: string | null;
  flightNumber: string | null;
  disruption: string | null;
  delayHours: string | null;
}) {
  const params = new URLSearchParams({
    leadId: lead.id,
    manual: "1",
    source: "checker",
    passengers: "1",
    reason: reasonFromDisruption(lead.disruption),
    departureAirportCode: lead.departureAirportCode,
    arrivalAirportCode: lead.arrivalAirportCode,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phoneFormatted ?? lead.phone,
  });
  const delayMinutes = delayMinutesFromLead(lead.delayHours);

  if (lead.flightDate) {
    params.set("flightDate", lead.flightDate.toISOString().slice(0, 10));
  }
  if (lead.airlineName) params.set("airlineName", lead.airlineName);
  if (lead.flightNumber) params.set("flightNumber", lead.flightNumber);
  if (delayMinutes) params.set("delayMinutes", delayMinutes);

  return `/formularz?${params.toString()}`;
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
          Sesja Supabase jest aktywna{email ? ` dla ${email}` : ""}, ale lista
          leadów wymaga powiązanego użytkownika CRM.
        </p>
      </div>
    </main>
  );
}

function ForbiddenState() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-neutral-200 bg-white p-6">
        <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">Brak dostępu</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Nie masz uprawnień do podglądu leadów.
        </p>
      </div>
    </main>
  );
}

function DatabaseMissingState() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] p-6">
        <p className="text-sm font-semibold text-[var(--ember-lo)]">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">Brak konfiguracji bazy</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ember-lo)]">
          Zakładka leadów wymaga aktywnego połączenia z bazą danych.
        </p>
      </div>
    </main>
  );
}

export default async function LeadsPage() {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  const canReadLeads =
    hasRolePermission(currentUser.appUser.role, PERMISSIONS.CLAIM_READ_ALL) ||
    hasRolePermission(currentUser.appUser.role, PERMISSIONS.CLIENT_READ);

  if (!canReadLeads) {
    return <ForbiddenState />;
  }

  if (!hasPrismaDatabaseUrl()) {
    return <DatabaseMissingState />;
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: {
        status: {
          not: LeadStatus.CONVERTED,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
    prisma.lead.count({
      where: {
        status: {
          not: LeadStatus.CONVERTED,
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Leady
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Kontakty z kalkulatora odszkodowania, które można jeszcze
              skonwertować na pełną sprawę.
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
            <span className="font-semibold text-neutral-950">{total}</span>{" "}
            leadów w CRM
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Klient</th>
                  <th className="px-4 py-3">Kontakt</th>
                  <th className="px-4 py-3">Lot</th>
                  <th className="px-4 py-3">Wycena</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Utworzono</th>
                  <th className="px-4 py-3">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {leads.length ? (
                  leads.map((lead) => (
                    <tr key={lead.id} className="transition hover:bg-neutral-50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-neutral-950">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {lead.marketingConsent ? "Marketing: tak" : "Marketing: nie"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        <a
                          href={`mailto:${lead.email}`}
                          className="block underline-offset-4 hover:underline"
                        >
                          {lead.email}
                        </a>
                        <a
                          href={`tel:${lead.phone}`}
                          className="mt-1 block underline-offset-4 hover:underline"
                        >
                          {lead.phoneFormatted ?? lead.phone}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        <p className="font-semibold text-neutral-950">
                          {lead.flightNumber ?? "Brak numeru"}
                        </p>
                        <p className="mt-1">
                          {lead.departureAirportCode} → {lead.arrivalAirportCode},{" "}
                          {formatDate(lead.flightDate)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {lead.airlineName ?? "Brak linii"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {lead.estimatedAmount ? (
                          <span className="inline-flex rounded-md border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] px-2 py-1 text-xs font-semibold text-[var(--ember-lo)]">
                            {lead.estimatedAmount} {lead.currency}
                          </span>
                        ) : (
                          <span className="text-neutral-500">Brak</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-semibold text-neutral-700">
                          {statusLabels[lead.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDateTime(lead.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={applicationHref(lead)}
                          className="inline-flex rounded-md border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
                        >
                          Utwórz sprawę
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <p className="text-base font-semibold text-neutral-950">
                        Brak leadów
                      </p>
                      <p className="mt-2 text-sm text-neutral-500">
                        Nowe kontakty pojawią się tutaj po przejściu klienta
                        przez kalkulator odszkodowania.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
