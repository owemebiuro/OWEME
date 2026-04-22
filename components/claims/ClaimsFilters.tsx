"use client";

import type { ClaimStatus, ClaimType } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import type { ClaimsOwnerOption } from "@/lib/claims/types";
import { buildClaimsSearchParams } from "@/lib/claims/url-filters";
import {
  CLAIM_STATUSES,
  CLAIM_TYPES,
  claimStatusClasses,
  claimStatusLabels,
  claimTypeLabels,
} from "@/lib/claims/status-colors";

type ClaimsFiltersProps = {
  owners: ClaimsOwnerOption[];
};

function splitParam(value: string | null) {
  return value?.split(",").filter(Boolean) ?? [];
}

export function ClaimsFilters({ owners }: ClaimsFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<number | null>(null);

  function replaceParams(updates: Parameters<typeof buildClaimsSearchParams>[1]) {
    const nextParams = buildClaimsSearchParams(searchParams, updates);

    startTransition(() => {
      router.replace(nextParams ? `${pathname}?${nextParams}` : pathname);
    });
  }

  function toggleListValue(key: "status" | "type", value: ClaimStatus | ClaimType) {
    const currentValues = splitParam(searchParams.get(key));
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    replaceParams({ [key]: nextValues });
  }

  function handleSearchChange(value: string) {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      const currentSearch = new URLSearchParams(paramsString).get("q") ?? "";

      if (value.trim() === currentSearch) {
        return;
      }

      const nextParams = buildClaimsSearchParams(
        new URLSearchParams(paramsString),
        { q: value.trim() || null },
      );

      startTransition(() => {
        router.replace(nextParams ? `${pathname}?${nextParams}` : pathname);
      });
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const selectedStatuses = splitParam(searchParams.get("status"));
  const selectedTypes = splitParam(searchParams.get("type"));

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_minmax(180px,0.8fr)_repeat(2,minmax(140px,0.6fr))_auto] lg:items-end">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Szukaj
          </span>
          <input
            key={searchParams.get("q") ?? ""}
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Numer, klient, email, telefon, lot"
            className="mt-1 h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Owner
          </span>
          <select
            value={searchParams.get("ownerId") ?? ""}
            onChange={(event) =>
              replaceParams({ ownerId: event.target.value || null })
            }
            className="mt-1 h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
          >
            <option value="">Wszyscy</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Lot od
          </span>
          <input
            type="date"
            value={searchParams.get("dateFrom") ?? ""}
            onChange={(event) =>
              replaceParams({ dateFrom: event.target.value || null })
            }
            className="mt-1 h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Lot do
          </span>
          <input
            type="date"
            value={searchParams.get("dateTo") ?? ""}
            onChange={(event) =>
              replaceParams({ dateTo: event.target.value || null })
            }
            className="mt-1 h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.replace(pathname);
            });
          }}
          className="h-11 rounded-md border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {CLAIM_STATUSES.map((status) => {
              const selected = selectedStatuses.includes(status);

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleListValue("status", status)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? claimStatusClasses[status]
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {claimStatusLabels[status]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Typ sprawy
            </p>
            <div className="flex flex-wrap gap-2">
              {CLAIM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleListValue("type", type)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition ${
                    selectedTypes.includes(type)
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {claimTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={searchParams.get("court") === "1"}
              onChange={(event) =>
                replaceParams({ court: event.target.checked ? "1" : null })
              }
              className="h-4 w-4 accent-neutral-950"
            />
            Tylko etap sądowy
          </label>
        </div>
      </div>

      {isPending ? (
        <p className="text-xs font-medium text-neutral-500">
          Odświeżam listę spraw...
        </p>
      ) : null}
    </section>
  );
}
