"use client";

import Link from "next/link";
import { useState } from "react";

type LogEvent = {
  kind: "status" | "assignment";
  id: string;
  createdAt: string;
  claimId: string;
  claimNumber: string;
  actor: string;
  description: string;
  detail: string | null;
};

type SystemLogsProps = {
  logs: LogEvent[];
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const KIND_LABELS = {
  status: "Status",
  assignment: "Przypisanie",
} as const;

const KIND_COLORS = {
  status: "bg-blue-100 text-blue-700",
  assignment: "bg-amber-100 text-amber-700",
} as const;

export function SystemLogs({ logs }: SystemLogsProps) {
  const [filter, setFilter] = useState<"all" | "status" | "assignment">("all");
  const [search, setSearch] = useState("");

  const filtered = logs.filter((log) => {
    if (filter !== "all" && log.kind !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.claimNumber.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM — Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Logi systemu
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Ostatnie 250 zdarzeń: zmiany statusów i przypisania spraw.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-950">{filtered.length}</span>
          zdarzeń
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po numerze sprawy, operatorze..."
          className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950"
        />
        <div className="flex gap-1 rounded-md border border-neutral-200 bg-white p-1">
          {(["all", "status", "assignment"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setFilter(kind)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                filter === kind
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {kind === "all" ? "Wszystkie" : KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Sprawa</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Opis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length ? (
                filtered.map((log) => (
                  <tr key={log.kind + log.id} className="align-top hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                      {dateFormatter.format(new Date(log.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${KIND_COLORS[log.kind]}`}>
                        {KIND_LABELS[log.kind]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/claims/${log.claimId}`}
                        prefetch={false}
                        className="font-semibold text-neutral-950 hover:underline"
                      >
                        {log.claimNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{log.actor}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {log.description}
                      {log.detail && (
                        <p className="mt-0.5 text-xs text-neutral-500">{log.detail}</p>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <p className="text-base font-semibold text-neutral-950">Brak zdarzeń</p>
                    <p className="mt-1 text-sm text-neutral-500">Zmień filtry lub wyszukiwanie.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
