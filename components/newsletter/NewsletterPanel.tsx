"use client";

import { useState, useMemo } from "react";

type Subscriber = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  claimsCount: number;
};

type NewsletterPanelProps = {
  subscribers: Subscriber[];
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function escapeCsv(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(rows: Subscriber[]) {
  const headers = ["Imię", "Nazwisko", "Email", "Liczba spraw", "Data rejestracji"];
  const lines = rows.map((r) =>
    [r.firstName, r.lastName, r.email, r.claimsCount, r.createdAt.slice(0, 10)]
      .map(escapeCsv)
      .join(","),
  );
  const csv = [headers.map(escapeCsv).join(","), ...lines].join("\r\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `oweme-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function NewsletterPanel({ subscribers }: NewsletterPanelProps) {
  const [search, setSearch] = useState("");
  const [minClaims, setMinClaims] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subscribers.filter((s) => {
      if (minClaims > 0 && s.claimsCount < minClaims) return false;
      if (!q) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [subscribers, search, minClaims]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Newsletter
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Lista klientów z adresami email — eksport do kampanii mailingowych.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
            <span className="font-semibold text-neutral-950">{filtered.length}</span>
            kontaktów
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            disabled={!filtered.length}
            className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            Eksport CSV
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po imieniu, nazwisku lub emailu..."
          className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950"
        />
        <div className="flex items-center gap-2">
          <label className="whitespace-nowrap text-sm text-neutral-600">Min. spraw:</label>
          <select
            value={minClaims}
            onChange={(e) => setMinClaims(Number(e.target.value))}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950"
          >
            <option value={0}>Wszyscy</option>
            <option value={1}>≥ 1 sprawa</option>
            <option value={2}>≥ 2 sprawy</option>
            <option value={3}>≥ 3 sprawy</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Imię i nazwisko</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Sprawy</th>
                <th className="px-4 py-3">Data rejestracji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length ? (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-neutral-950">
                      {sub.firstName} {sub.lastName}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{sub.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
                        {sub.claimsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {dateFormatter.format(new Date(sub.createdAt))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center">
                    <p className="text-base font-semibold text-neutral-950">Brak wyników</p>
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
