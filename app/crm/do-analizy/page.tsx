import { ClaimStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { AnalysisActions } from "@/components/claims/AnalysisActions";
import { ClaimTypeBadge } from "@/components/claims/ClaimStatusBadge";
import { requireAuth } from "@/lib/auth-helpers";
import { formatFileSize } from "@/lib/claims/format";
import { attachmentTypeLabels } from "@/lib/claims/detail-labels";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import { generateDownloadUrl } from "@/lib/storage/r2";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";

export const metadata: Metadata = {
  title: "Do analizy | OWEME CRM",
};

const payloadLabels: Record<string, string> = {
  NUMER_UMOWY_CESJI: "Numer umowy cesji",
  NUMER_PELNOMOCNICTWA: "Numer pełnomocnictwa",
  DATA_ZAWARCIA: "Data zawarcia",
  DATA_LOTU: "Data lotu",
  NR_LOTU: "Numer lotu",
  PORT_ODLOTU_IATA: "Lotnisko wylotu",
  PORT_PRZYLOTU_IATA: "Lotnisko przylotu",
  NAZWA_LINII_LOTNICZEJ: "Linia lotnicza",
  POWOD_WNIOSKU: "Powód wniosku",
  OPOZNIENIE_MINUTY: "Opóźnienie",
  SZACOWANA_KWOTA_EUR: "Szacowana kwota",
  IMIE_NAZWISKO_KLIENTA: "Klient",
  PESEL_NIP_KLIENTA: "PESEL / NIP",
  ADRES_KLIENTA: "Adres",
  NR_DOK_TOZSAMOSCI: "Dokument tożsamości",
  EMAIL_KLIENTA: "Email",
  TELEFON_KLIENTA: "Telefon",
  NUMER_KONTA_BANKOWEGO: "Numer konta",
  LICZBA_PASAZEROW: "Liczba pasażerów",
};

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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function renderPayloadValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Brak";
  }

  if (typeof value === "boolean") {
    return value ? "Tak" : "Nie";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return `${value.length} pozycji`;
  }

  return "Dodano";
}

function isPayloadFile(value: unknown): value is {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
} {
  return (
    isPlainRecord(value) &&
    typeof value.fileName === "string" &&
    typeof value.mimeType === "string" &&
    typeof value.sizeBytes === "number" &&
    typeof value.dataUrl === "string"
  );
}

function payloadAttachmentEntries(payload: unknown) {
  if (!isPlainRecord(payload)) {
    return [];
  }

  const files: Array<{
    key: string;
    label: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  }> = [];

  if (isPayloadFile(payload.KARTA_POKLADOWA)) {
    files.push({
      key: "KARTA_POKLADOWA",
      label: "Karta pokładowa",
      ...payload.KARTA_POKLADOWA,
    });
  }

  if (Array.isArray(payload.ZDJECIA_DODATKOWE)) {
    payload.ZDJECIA_DODATKOWE.forEach((file, index) => {
      if (!isPayloadFile(file)) {
        return;
      }

      files.push({
        key: `ZDJECIA_DODATKOWE_${index}`,
        label: "Zdjęcie dodatkowe",
        ...file,
      });
    });
  }

  return files;
}

function visiblePayloadEntries(payload: unknown) {
  if (!isPlainRecord(payload)) {
    return [];
  }

  return Object.entries(payload).filter(
    ([key]) => key !== "KARTA_POKLADOWA" && key !== "ZDJECIA_DODATKOWE",
  );
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
          wniosków do analizy wymaga powiązanego użytkownika CRM.
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
          Nie masz uprawnień do analizy nowych wniosków.
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
          Zakładka „Do analizy” wymaga aktywnego połączenia z bazą danych.
        </p>
      </div>
    </main>
  );
}

export default async function ClaimsForAnalysisPage() {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  if (
    !hasRolePermission(currentUser.appUser.role, PERMISSIONS.CLAIM_READ_ALL)
  ) {
    return <ForbiddenState />;
  }

  if (!hasPrismaDatabaseUrl()) {
    return <DatabaseMissingState />;
  }

  const claims = await prisma.claim.findMany({
    where: {
      deletedAt: null,
      status: ClaimStatus.AWAITING_VERIFICATION,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: true,
      flight: true,
      airline: true,
      passengers: true,
      attachments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  const claimsWithAttachmentUrls = await Promise.all(
    claims.map(async (claim) => ({
      ...claim,
      attachments: await Promise.all(
        claim.attachments.map(async (attachment) => {
          try {
            return {
              ...attachment,
              downloadUrl: await generateDownloadUrl(attachment.storageKey),
            };
          } catch (error) {
            console.error(
              "[Do analizy] Nie udało się przygotować podglądu załącznika.",
              {
                attachmentId: attachment.id,
                claimId: claim.id,
                error,
              },
            );

            return {
              ...attachment,
              downloadUrl: null,
            };
          }
        }),
      ),
    })),
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Do analizy
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
              Pełne wnioski złożone przez klientów. Po analizie kliknij
              „Przeanalizowano”, żeby przenieść sprawę do standardowej zakładki
              „Sprawy”.
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
            <span className="font-semibold text-neutral-950">{claims.length}</span>{" "}
            wniosków oczekuje
          </div>
        </header>

        <section className="space-y-4">
          {claims.length ? (
            claimsWithAttachmentUrls.map((claim) => {
              const payloadEntries = visiblePayloadEntries(
                claim.applicationPayload,
              );
              const payloadFiles = payloadAttachmentEntries(
                claim.applicationPayload,
              );

              return (
                <article
                  key={claim.id}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-neutral-100 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/crm/claims/${claim.id}`}
                          className="text-lg font-semibold text-neutral-950 underline-offset-4 hover:underline"
                        >
                          {claim.claimNumber}
                        </Link>
                        <ClaimTypeBadge type={claim.type} />
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                          Do analizy
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">
                        Utworzono {formatDateTime(claim.createdAt)}
                      </p>
                    </div>
                    <AnalysisActions claimId={claim.id} />
                  </div>

                  <div className="grid gap-4 px-4 py-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <section className="space-y-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                        Dane klienta i lotu
                      </h2>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <DataRow
                          label="Klient"
                          value={`${claim.client.firstName} ${claim.client.lastName}`}
                        />
                        <DataRow label="Email" value={claim.client.email} />
                        <DataRow
                          label="Telefon"
                          value={claim.client.phone ?? "Brak"}
                        />
                        <DataRow
                          label="PESEL"
                          value={claim.client.pesel ?? "Brak"}
                        />
                        <DataRow
                          label="Dokument"
                          value={
                            claim.client.idDocumentNumber ??
                            claim.client.documentNumber ??
                            "Brak"
                          }
                        />
                        <DataRow
                          label="Konto"
                          value={claim.clientIban ?? "Brak"}
                        />
                        <DataRow
                          label="Adres"
                          value={[
                            claim.client.address,
                            [claim.client.postalCode, claim.client.city]
                              .filter(Boolean)
                              .join(" "),
                            claim.client.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        />
                        <DataRow
                          label="Lot"
                          value={
                            claim.flight
                              ? `${claim.flight.flightNumber}, ${claim.flight.departureAirportCode} → ${claim.flight.arrivalAirportCode}, ${formatDate(claim.flight.flightDate)}`
                              : "Brak"
                          }
                        />
                        <DataRow
                          label="Linia"
                          value={claim.airline?.name ?? "Brak"}
                        />
                        <DataRow
                          label="Pasażerowie"
                          value={String(claim.passengers.length)}
                        />
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                        Dane z formularza
                      </h2>
                      {payloadEntries.length ? (
                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          {payloadEntries.map(([key, value]) => (
                            <DataRow
                              key={key}
                              label={payloadLabels[key] ?? key}
                              value={renderPayloadValue(value)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-md border border-dashed border-neutral-200 px-3 py-4 text-sm text-neutral-500">
                          Brak surowego payloadu formularza dla tej sprawy.
                        </p>
                      )}
                    </section>
                  </div>

                  <div className="border-t border-neutral-100 px-4 py-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                        Załączniki klienta
                      </h2>
                      <Link
                        href={`/crm/claims/${claim.id}`}
                        className="text-sm font-semibold text-neutral-950 underline-offset-4 hover:underline"
                      >
                        Otwórz pełną sprawę
                      </Link>
                    </div>
                    {claim.attachments.length || payloadFiles.length ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        {claim.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                          >
                            <p className="font-semibold text-neutral-950">
                              {attachment.fileName}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {attachmentTypeLabels[attachment.type]} ·{" "}
                              {formatFileSize(attachment.sizeBytes)} ·{" "}
                              {attachment.verificationStatus}
                            </p>
                            {attachment.downloadUrl ? (
                              <a
                                href={attachment.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex h-8 items-center rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400"
                              >
                                Otwórz załącznik
                              </a>
                            ) : (
                              <p className="mt-2 text-xs font-semibold text-red-600">
                                Nie udało się przygotować podglądu.
                              </p>
                            )}
                          </div>
                        ))}
                        {!claim.attachments.length
                          ? payloadFiles.map((file) => (
                              <div
                                key={file.key}
                                className="rounded-md border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] px-3 py-2 text-sm"
                              >
                                <p className="font-semibold text-neutral-950">
                                  {file.fileName}
                                </p>
                                <p className="mt-1 text-xs text-[var(--ember-lo)]">
                                  {file.label} · {formatFileSize(file.sizeBytes)} ·
                                  zapisane w formularzu
                                </p>
                                <a
                                  href={file.dataUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex h-8 items-center rounded-md border border-[rgba(27,111,212,0.22)] bg-white px-3 text-xs font-semibold text-[var(--ember-lo)] transition hover:border-[rgba(27,111,212,0.42)]"
                                >
                                  Otwórz z formularza
                                </a>
                              </div>
                            ))
                          : null}
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed border-neutral-200 px-3 py-4 text-sm text-neutral-500">
                        Klient nie dodał zdjęć ani karty pokładowej.
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-14 text-center shadow-sm">
              <p className="text-base font-semibold text-neutral-950">
                Brak wniosków do analizy
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Nowe pełne wnioski klientów pojawią się tutaj automatycznie.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DataRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-neutral-950">
        {renderPayloadValue(value)}
      </p>
    </div>
  );
}
