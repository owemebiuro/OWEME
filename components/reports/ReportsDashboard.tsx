"use client";

import type { ClaimSource, ClaimStatus, UserRole } from "@prisma/client";
import { useMemo, useState } from "react";

import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { KpiCard } from "@/components/reports/KpiCard";
import { formatCurrency } from "@/lib/claims/format";
import {
  claimSourceLabels,
  claimStatusLabels,
} from "@/lib/claims/status-colors";
import { api } from "@/lib/trpc/hooks";

type ReportsDashboardProps = {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

type CsvValue = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvValue>;

const managementRoles: readonly UserRole[] = ["ADMIN", "READ_ONLY"];
const salesRoles: readonly UserRole[] = ["ADMIN", "READ_ONLY", "MARKETING"];

function toInputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 30);

  return {
    dateFrom: toInputDate(dateFrom),
    dateTo: toInputDate(dateTo),
  };
}

function toQueryDate(value: string, endOfDay = false) {
  if (!value) {
    const fallback = endOfDay ? new Date() : getDefaultDateRangeDate();
    fallback.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return fallback;
  }

  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
}

function getDefaultDateRangeDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDays(value: number) {
  return value ? `${value.toFixed(1)} dni` : "Brak danych";
}

function escapeCsvValue(value: CsvValue) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(fileName: string, rows: CsvRow[]) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ].join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function AccessNotice({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm font-medium text-neutral-600">
      {children}
    </div>
  );
}

function QueryState({
  isLoading,
  error,
}: {
  isLoading: boolean;
  error: { message: string } | null;
}) {
  if (isLoading) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white p-5 text-sm font-medium text-neutral-500">
        Ładuję dane raportowe...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {error.message}
      </p>
    );
  }

  return null;
}

export function ReportsDashboard({ currentUser }: ReportsDashboardProps) {
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const canViewManagementReports = managementRoles.includes(currentUser.role);
  const canViewSalesReports = salesRoles.includes(currentUser.role);
  const queryInput = useMemo(
    () => ({
      dateFrom: toQueryDate(dateFrom),
      dateTo: toQueryDate(dateTo, true),
    }),
    [dateFrom, dateTo],
  );

  const operationalQuery = api.reports.operationalKpis.useQuery(queryInput, {
    enabled: canViewManagementReports,
  });
  const financialQuery = api.reports.financialKpis.useQuery(queryInput, {
    enabled: canViewManagementReports,
  });
  const salesQuery = api.reports.salesKpis.useQuery(queryInput, {
    enabled: canViewSalesReports,
  });

  function resetDateRange() {
    const next = getDefaultDateRange();
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Raporty KPI
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Operacyjny widok wyników, spraw, portfela i źródeł pozyskania.
          </p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          Rola: <span className="font-semibold text-neutral-950">{currentUser.role}</span>
        </div>
      </header>

      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onReset={resetDateRange}
      />

      <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-neutral-950">Operacyjne</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Statusy, czas obsługi i obciążenie operatorów.
          </p>
        </div>
        {!canViewManagementReports ? (
          <AccessNotice>
            Ta sekcja jest dostępna dla ról ADMIN i READ_ONLY.
          </AccessNotice>
        ) : (
          <>
            <QueryState
              isLoading={operationalQuery.isLoading}
              error={operationalQuery.error}
            />
            {operationalQuery.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <KpiCard
                    label="Sprawy w okresie"
                    value={operationalQuery.data.totalClaims}
                  />
                  <KpiCard
                    label="Do kwalifikacji"
                    value={formatDays(operationalQuery.data.avgTimeToQualification)}
                  />
                  <KpiCard
                    label="Do wezwania"
                    value={formatDays(operationalQuery.data.avgTimeToDemandLetter)}
                  />
                  <KpiCard
                    label="Do zamknięcia"
                    value={formatDays(operationalQuery.data.avgTimeToClose)}
                  />
                  <KpiCard
                    label="Zaległe zadania"
                    value={operationalQuery.data.overdueTasksCount}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div className="rounded-lg border border-neutral-200">
                    <div className="border-b border-neutral-100 px-4 py-3">
                      <h3 className="font-semibold text-neutral-950">
                        Statusy spraw
                      </h3>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {operationalQuery.data.byStatus.length ? (
                        operationalQuery.data.byStatus.map((row) => (
                          <div
                            key={row.status}
                            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                          >
                            <span className="text-neutral-700">
                              {claimStatusLabels[row.status as ClaimStatus]}
                            </span>
                            <span className="font-semibold text-neutral-950">
                              {row.count}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-6 text-sm text-neutral-500">
                          Brak spraw w okresie.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                      <h3 className="font-semibold text-neutral-950">
                        Sprawy per operator
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          downloadCsv(
                            "oweme-operatorzy.csv",
                            operationalQuery.data.claimsPerOperator.map((row) => ({
                              operator: row.userName,
                              sprawy: row.count,
                              wygrane: row.wonCount,
                            })),
                          )
                        }
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400"
                      >
                        Eksport CSV
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          <tr>
                            <th className="px-4 py-3">Operator</th>
                            <th className="px-4 py-3">Sprawy</th>
                            <th className="px-4 py-3">Wygrane</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {operationalQuery.data.claimsPerOperator.length ? (
                            operationalQuery.data.claimsPerOperator.map((row) => (
                              <tr key={row.userId}>
                                <td className="px-4 py-3 font-semibold text-neutral-950">
                                  {row.userName}
                                </td>
                                <td className="px-4 py-3 text-neutral-600">
                                  {row.count}
                                </td>
                                <td className="px-4 py-3 text-neutral-600">
                                  {row.wonCount}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-8 text-center text-neutral-500"
                              >
                                Brak przypisanych spraw w okresie.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-neutral-950">Finansowe</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Portfel, odzyskane kwoty i prowizje OWEME.
          </p>
        </div>
        {!canViewManagementReports ? (
          <AccessNotice>
            Ta sekcja jest dostępna dla ról ADMIN i READ_ONLY.
          </AccessNotice>
        ) : (
          <>
            <QueryState
              isLoading={financialQuery.isLoading}
              error={financialQuery.error}
            />
            {financialQuery.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <KpiCard
                    label="Wartość potencjalna"
                    value={formatCurrency(financialQuery.data.totalPotentialValue)}
                  />
                  <KpiCard
                    label="Odzyskano"
                    value={formatCurrency(financialQuery.data.totalRecovered)}
                  />
                  <KpiCard
                    label="Prowizje OWEME"
                    value={formatCurrency(financialQuery.data.totalFees)}
                  />
                  <KpiCard
                    label="Śr. prowizja"
                    value={formatCurrency(financialQuery.data.avgFeePerClaim)}
                  />
                  <KpiCard
                    label="Skuteczność"
                    value={formatPercent(financialQuery.data.successRate)}
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                    <div>
                      <h3 className="font-semibold text-neutral-950">
                        Wyniki per linia lotnicza
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        Wartość spraw sądowych:{" "}
                        {formatCurrency(financialQuery.data.courtStageValue)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadCsv(
                          "oweme-linie-lotnicze.csv",
                          financialQuery.data.byAirline.map((row) => ({
                            linia: row.airlineName,
                            sprawy: row.claimCount,
                            odzyskano: row.totalRecovered,
                            prowizje: row.totalFees,
                          })),
                        )
                      }
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400"
                    >
                      Eksport CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        <tr>
                          <th className="px-4 py-3">Linia</th>
                          <th className="px-4 py-3">Sprawy</th>
                          <th className="px-4 py-3">Odzyskano</th>
                          <th className="px-4 py-3">Prowizje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {financialQuery.data.byAirline.length ? (
                          financialQuery.data.byAirline.map((row) => (
                            <tr key={row.airlineName}>
                              <td className="px-4 py-3 font-semibold text-neutral-950">
                                {row.airlineName}
                              </td>
                              <td className="px-4 py-3 text-neutral-600">
                                {row.claimCount}
                              </td>
                              <td className="px-4 py-3 text-neutral-600">
                                {formatCurrency(row.totalRecovered)}
                              </td>
                              <td className="px-4 py-3 text-neutral-600">
                                {formatCurrency(row.totalFees)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-neutral-500"
                            >
                              Brak rozliczeń w okresie.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-neutral-950">Sprzedażowe</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Leady, kwalifikacje i źródła pozyskania spraw.
          </p>
        </div>
        {!canViewSalesReports ? (
          <AccessNotice>
            Ta sekcja jest dostępna dla ról ADMIN, READ_ONLY i MARKETING.
          </AccessNotice>
        ) : (
          <>
            <QueryState isLoading={salesQuery.isLoading} error={salesQuery.error} />
            {salesQuery.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <KpiCard label="Leady" value={salesQuery.data.totalLeads} />
                  <KpiCard
                    label="Zakwalifikowane"
                    value={salesQuery.data.qualifiedClaims}
                  />
                  <KpiCard
                    label="Konwersja"
                    value={formatPercent(salesQuery.data.conversionRate)}
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                    <h3 className="font-semibold text-neutral-950">
                      Źródła leadów
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        downloadCsv(
                          "oweme-zrodla.csv",
                          salesQuery.data.bySource.map((row) => ({
                            zrodlo: claimSourceLabels[row.source as ClaimSource],
                            leady: row.count,
                            zakwalifikowane: row.qualified,
                          })),
                        )
                      }
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400"
                    >
                      Eksport CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        <tr>
                          <th className="px-4 py-3">Źródło</th>
                          <th className="px-4 py-3">Leady</th>
                          <th className="px-4 py-3">Zakwalifikowane</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {salesQuery.data.bySource.map((row) => (
                          <tr key={row.source}>
                            <td className="px-4 py-3 font-semibold text-neutral-950">
                              {claimSourceLabels[row.source as ClaimSource]}
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              {row.count}
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              {row.qualified}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
