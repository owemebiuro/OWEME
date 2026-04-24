"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { claimStatusLabels } from "@/lib/claims/status-colors";
import { api } from "@/lib/trpc/hooks";
import type { ClaimStatus } from "@prisma/client";

const TYPE_LABELS: Record<string, string> = {
  DELAY: "Opóźnienie",
  CANCELLATION: "Odwołanie",
  DENIED_BOARDING: "Odmowa wejścia",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "#94a3b8",
  AWAITING_VERIFICATION: "#60a5fa",
  MISSING_DATA: "#f97316",
  QUALIFIED: "#34d399",
  DOCUMENTS_GENERATED: "#a78bfa",
  ASSIGNMENT_SIGNED: "#6366f1",
  DEMAND_LETTER_PREPARED: "#fb7185",
  DEMAND_LETTER_SENT: "#f43f5e",
  AWAITING_AIRLINE_RESPONSE: "#fbbf24",
  NEGATIVE_RESPONSE: "#ef4444",
  COURT_DECISION_PENDING: "#8b5cf6",
  COURT_STAGE: "#7c3aed",
  WON: "#10b981",
  SETTLEMENT: "#059669",
  CLOSED_PAID: "#047857",
  REJECTED: "#dc2626",
  DISMISSED: "#991b1b",
};

const CHART_COLORS = ["#14b8a6", "#6366f1", "#f97316", "#ec4899", "#84cc16", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-neutral-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
      <p className="text-sm text-neutral-500">Ładuję dane...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
      <p className="text-sm text-neutral-500">Brak danych do wyświetlenia.</p>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [months, setMonths] = useState(12);

  const overTimeQuery = api.analytics.claimsOverTime.useQuery({ months });
  const statusQuery = api.analytics.statusDistribution.useQuery();
  const typeQuery = api.analytics.claimsByType.useQuery({ months });
  const airlinesQuery = api.analytics.topAirlines.useQuery();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Analityka
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Trendy miesięczne, rozkład statusów i aktywność linii lotniczych.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Okres:</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950"
          >
            <option value={3}>3 miesiące</option>
            <option value={6}>6 miesięcy</option>
            <option value={12}>12 miesięcy</option>
            <option value={24}>24 miesiące</option>
          </select>
        </div>
      </header>

      {/* Claims over time */}
      <SectionCard
        title="Sprawy w czasie"
        description="Liczba nowych spraw oraz wygranych per miesiąc."
      >
        {overTimeQuery.isLoading ? (
          <LoadingState />
        ) : !overTimeQuery.data?.length ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={overTimeQuery.data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line
                type="monotone"
                dataKey="total"
                name="Nowe sprawy"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="won"
                name="Wygrane"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="active"
                name="Aktywne"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Status distribution */}
        <SectionCard title="Rozkład statusów" description="Wszystkie aktywne sprawy według obecnego statusu.">
          {statusQuery.isLoading ? (
            <LoadingState />
          ) : !statusQuery.data?.length ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusQuery.data}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusQuery.data.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, claimStatusLabels[name as ClaimStatus] ?? name]}
                    contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="min-w-0 flex-1 space-y-1">
                {statusQuery.data.slice(0, 10).map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: STATUS_COLORS[entry.status] ?? "#94a3b8" }}
                      />
                      <span className="truncate text-neutral-700">
                        {claimStatusLabels[entry.status as ClaimStatus] ?? entry.status}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold text-neutral-950">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Claims by type over time */}
        <SectionCard title="Typ sprawy" description="Opóźnienia, odwołania i odmowy wejścia per miesiąc.">
          {typeQuery.isLoading ? (
            <LoadingState />
          ) : !typeQuery.data?.length ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeQuery.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(value, key) => [value, TYPE_LABELS[key as string] ?? key]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => TYPE_LABELS[value] ?? value}
                />
                <Bar dataKey="DELAY" stackId="a" fill="#14b8a6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="CANCELLATION" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="DENIED_BOARDING" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Top airlines */}
      <SectionCard title="Najaktywniejsze linie lotnicze" description="Top 10 linii według liczby spraw.">
        {airlinesQuery.isLoading ? (
          <LoadingState />
        ) : !airlinesQuery.data?.length ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={airlinesQuery.data}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="iata"
                  tick={{ fontSize: 11, fill: "#374151" }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(value, _key, props) => [value, props.payload?.airline ?? "Sprawy"]}
                />
                <Bar dataKey="count" name="Sprawy" radius={[0, 4, 4, 0]}>
                  {airlinesQuery.data.map((entry, index) => (
                    <Cell key={entry.airline} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Linia</th>
                    <th className="px-4 py-3">IATA</th>
                    <th className="px-4 py-3 text-right">Sprawy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {airlinesQuery.data.map((row, index) => (
                    <tr key={row.airline} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-neutral-500">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-neutral-950">{row.airline}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.iata}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-950">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
