"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { useMemo, useState } from "react";

import { formatDateTime, formatFileSize } from "@/lib/claims/format";
import { api } from "@/lib/trpc/hooks";
import type { AppRouter } from "@/lib/trpc/types";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type BackupListOutput = RouterOutputs["backups"]["list"];
type BackupEntry = BackupListOutput["backups"][number];
type BackupStorageStatus = BackupListOutput["storage"];

type BackupsPanelProps = {
  initialBackups: BackupEntry[];
  initialStorage: BackupStorageStatus;
};

const STATUS_LABELS = {
  completed: "Zakończona",
} as const;

const STATUS_COLORS = {
  completed: "bg-teal-100 text-teal-700",
} as const;

const BACKEND_LABELS = {
  r2: "R2",
  "local-dev": "Local dev",
} as const;

function StorageNotice({ storage }: { storage: BackupStorageStatus }) {
  if (storage.backend === "r2") {
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
        <p className="font-semibold">Storage aktywny</p>
        <p className="mt-1">
          Ręczne kopie zapasowe są zapisywane w Cloudflare R2. Supabase PITR
          pozostaje dodatkową warstwą odzyskiwania bazy.
        </p>
      </div>
    );
  }

  if (storage.backend === "local-dev") {
    return (
      <div className="rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] p-4 text-sm text-[var(--ember-lo)]">
        <p className="font-semibold">Tryb developerski</p>
        <p className="mt-1">
          Brakuje konfiguracji R2, więc lokalnie kopie będą zapisywane w
          katalogu `.dev-storage`. Na produkcji uzupełnij zmienne:
          {" "}
          {storage.missingEnv.join(", ")}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-semibold">Brak konfiguracji storage</p>
      <p className="mt-1">
        Tworzenie ręcznych kopii wymaga konfiguracji R2. Brakuje zmiennych:
        {" "}
        {storage.missingEnv.join(", ")}.
      </p>
    </div>
  );
}

export function BackupsPanel({
  initialBackups,
  initialStorage,
}: BackupsPanelProps) {
  const utils = api.useUtils();
  const [notice, setNotice] = useState<string | null>(null);
  const [downloadingBackupId, setDownloadingBackupId] = useState<string | null>(
    null,
  );

  const backupsQuery = api.backups.list.useQuery(undefined, {
    initialData: {
      backups: initialBackups,
      storage: initialStorage,
    },
  });
  const createBackup = api.backups.create.useMutation({
    onSuccess: async (result) => {
      setNotice(`Kopia ${result.backup.name} została utworzona.`);
      utils.backups.list.setData(undefined, (current) => ({
        backups: [
          result.backup,
          ...(current?.backups.filter(
            (backup) => backup.id !== result.backup.id,
          ) ?? []),
        ],
        storage: result.storage,
      }));
      await utils.backups.list.invalidate();
    },
  });
  const getDownloadUrl = api.backups.getDownloadUrl.useMutation();

  const data = backupsQuery.data ?? {
    backups: initialBackups,
    storage: initialStorage,
  };
  const backups = data.backups;
  const storage = data.storage;
  const latestBackup = backups[0];
  const errorMessage =
    backupsQuery.error?.message ??
    createBackup.error?.message ??
    getDownloadUrl.error?.message;

  const summaryItems = useMemo(
    () => [
      {
        label: "Ostatnia kopia",
        value: latestBackup ? formatDateTime(latestBackup.createdAt) : "Brak kopii",
      },
      {
        label: "Storage",
        value: storage.label,
      },
      {
        label: "Format",
        value: "JSON.gz",
      },
    ],
    [latestBackup, storage.label],
  );

  function handleManualBackup() {
    setNotice(null);
    createBackup.mutate();
  }

  async function downloadBackup(backupId: string) {
    setNotice(null);
    setDownloadingBackupId(backupId);

    try {
      const result = await getDownloadUrl.mutateAsync({ backupId });
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingBackupId(null);
    }
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
            Ręczne eksporty danych CRM z możliwością pobrania pliku.
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualBackup}
          disabled={createBackup.isPending || !storage.canCreate}
          title={
            storage.canCreate
              ? undefined
              : "Skonfiguruj R2, aby tworzyć kopie zapasowe."
          }
          className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createBackup.isPending ? "Trwa tworzenie..." : "Utwórz teraz"}
        </button>
      </header>

      {notice ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          {notice}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-neutral-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-neutral-950">Historia kopii</h2>
          {backupsQuery.isFetching ? (
            <span className="text-xs font-medium text-neutral-500">
              Odświeżanie...
            </span>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nazwa pliku</th>
                <th className="px-4 py-3">Rozmiar</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Storage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {backups.length ? (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                      {backup.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatFileSize(backup.sizeBytes)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDateTime(backup.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {BACKEND_LABELS[backup.backend]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[backup.status]}`}
                      >
                        {STATUS_LABELS[backup.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-neutral-600 hover:text-neutral-950 disabled:cursor-wait disabled:opacity-50"
                        disabled={downloadingBackupId === backup.id}
                        onClick={() => void downloadBackup(backup.id)}
                      >
                        {downloadingBackupId === backup.id
                          ? "Przygotowuję..."
                          : "Pobierz"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <p className="text-base font-semibold text-neutral-950">
                      Brak ręcznych kopii
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Utwórz pierwszą kopię zapasową, aby pojawiła się w historii.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StorageNotice storage={storage} />
    </div>
  );
}
