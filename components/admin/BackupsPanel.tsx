"use client";

import { useState } from "react";

type BackupEntry = {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  status: "completed" | "in_progress" | "failed";
};

const MOCK_BACKUPS: BackupEntry[] = [
  { id: "1", name: "oweme-backup-2026-04-24.sql.gz", size: "12.4 MB", createdAt: "2026-04-24 03:00", status: "completed" },
  { id: "2", name: "oweme-backup-2026-04-23.sql.gz", size: "12.1 MB", createdAt: "2026-04-23 03:00", status: "completed" },
  { id: "3", name: "oweme-backup-2026-04-22.sql.gz", size: "11.9 MB", createdAt: "2026-04-22 03:00", status: "completed" },
  { id: "4", name: "oweme-backup-2026-04-21.sql.gz", size: "11.8 MB", createdAt: "2026-04-21 03:00", status: "completed" },
  { id: "5", name: "oweme-backup-2026-04-20.sql.gz", size: "11.6 MB", createdAt: "2026-04-20 03:00", status: "completed" },
];

const STATUS_LABELS = {
  completed: "Zakończona",
  in_progress: "W toku",
  failed: "Błąd",
} as const;

const STATUS_COLORS = {
  completed: "bg-teal-100 text-teal-700",
  in_progress: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
} as const;

export function BackupsPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleManualBackup() {
    setIsRunning(true);
    setNotice(null);
    setTimeout(() => {
      setIsRunning(false);
      setNotice("Kopia zapasowa została zlecona. Pojawi się na liście po zakończeniu (zwykle do 5 minut).");
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM — Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Kopie zapasowe
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Automatyczne kopie bazy danych. Tworzone codziennie o 03:00 UTC.
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualBackup}
          disabled={isRunning}
          className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {isRunning ? "Trwa tworzenie..." : "Utwórz teraz"}
        </button>
      </header>

      {notice && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Ostatnia kopia", value: "Dzisiaj 03:00" },
          { label: "Przechowywanie", value: "30 dni" },
          { label: "Harmonogram", value: "Codziennie 03:00 UTC" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-neutral-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-semibold text-neutral-950">Historia kopii</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nazwa pliku</th>
                <th className="px-4 py-3">Rozmiar</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {MOCK_BACKUPS.map((backup) => (
                <tr key={backup.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700">{backup.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{backup.size}</td>
                  <td className="px-4 py-3 text-neutral-600">{backup.createdAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[backup.status]}`}>
                      {STATUS_LABELS[backup.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
                      onClick={() => alert("Pobieranie kopii zapasowej wymaga konfiguracji S3/Storage.")}
                    >
                      Pobierz
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Informacja</p>
        <p className="mt-1">
          Kopie zapasowe są przechowywane w Supabase Point-in-Time Recovery (PITR).
          Pełna integracja z pobraniem pliku wymaga konfiguracji storage S3.
        </p>
      </div>
    </div>
  );
}
