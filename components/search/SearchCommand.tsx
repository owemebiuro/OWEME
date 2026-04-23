"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { claimStatusLabels } from "@/lib/claims/status-colors";
import { api } from "@/lib/trpc/hooks";

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 200);
  const shouldSearch = debouncedQuery.length >= 3;
  const search = api.search.globalSearch.useQuery(
    { query: debouncedQuery },
    {
      enabled: open && shouldSearch,
    },
  );
  const totalResults = useMemo(() => {
    return (search.data?.claims.length ?? 0) + (search.data?.clients.length ?? 0);
  }, [search.data]);

  const closeCommand = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCommand();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        if (!isEditableTarget(event.target)) {
          setOpen((current) => {
            const nextOpen = !current;

            if (!nextOpen) {
              setQuery("");
            }

            return nextOpen;
          });
        } else {
          setOpen(true);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeCommand]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  function navigateTo(href: string) {
    closeCommand();
    router.push(href);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 hidden rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-400 lg:inline-flex"
      >
        Szukaj Ctrl+K
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/35 px-4 py-16"
      role="dialog"
      aria-modal="true"
      aria-label="Globalna wyszukiwarka CRM"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeCommand();
        }
      }}
    >
      <div className="mx-auto max-w-2xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl">
        <div className="border-b border-neutral-100 p-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj sprawy lub klienta..."
            className="h-12 w-full border-0 bg-transparent text-lg font-semibold text-neutral-950 outline-none placeholder:text-neutral-400"
          />
          <p className="mt-1 text-xs font-medium text-neutral-500">
            Minimum 3 znaki · Enter nie jest wymagany · Escape zamyka
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!shouldSearch ? (
            <p className="p-6 text-center text-sm text-neutral-500">
              Wpisz co najmniej 3 znaki, żeby rozpocząć wyszukiwanie.
            </p>
          ) : search.isLoading ? (
            <p className="p-6 text-center text-sm text-neutral-500">
              Szukam...
            </p>
          ) : search.error ? (
            <p className="p-6 text-center text-sm font-semibold text-red-700">
              {search.error.message}
            </p>
          ) : totalResults === 0 ? (
            <p className="p-6 text-center text-sm text-neutral-500">
              Brak wyników dla tego zapytania.
            </p>
          ) : (
            <div className="space-y-3">
              <section>
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Sprawy
                </p>
                {search.data?.claims.length ? (
                  search.data.claims.map((claim) => (
                    <button
                      key={claim.id}
                      type="button"
                      onClick={() => navigateTo(`/crm/claims/${claim.id}`)}
                      className="block w-full rounded-md px-3 py-3 text-left transition hover:bg-neutral-50"
                    >
                      <span className="font-semibold text-neutral-950">
                        {claim.claimNumber}
                      </span>
                      <span className="ml-2 text-sm text-neutral-500">
                        {claim.clientName} · {claimStatusLabels[claim.status]}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-neutral-400">
                    Brak spraw.
                  </p>
                )}
              </section>

              <section>
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Klienci
                </p>
                {search.data?.clients.length ? (
                  search.data.clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => navigateTo(`/crm/clients/${client.id}`)}
                      className="block w-full rounded-md px-3 py-3 text-left transition hover:bg-neutral-50"
                    >
                      <span className="font-semibold text-neutral-950">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="ml-2 text-sm text-neutral-500">
                        {client.email}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-neutral-400">
                    Brak klientów.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
