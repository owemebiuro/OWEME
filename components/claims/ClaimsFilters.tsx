"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { buildClaimsSearchParams } from "@/lib/claims/url-filters";
import type { CaseView } from "@/lib/constants/statuses";

const filterFields = [
  { key: "flightNumber", label: "Numer lotu", type: "text", placeholder: "LO231" },
  { key: "firstName", label: "Imię", type: "text", placeholder: "Jan" },
  { key: "lastName", label: "Nazwisko", type: "text", placeholder: "Kowalski" },
  { key: "phone", label: "Telefon", type: "text", placeholder: "+48 123" },
  { key: "email", label: "Email", type: "text", placeholder: "jan@example.com" },
  { key: "dateFrom", label: "Data dodania od", type: "date", placeholder: "" },
  { key: "dateTo", label: "Data dodania do", type: "date", placeholder: "" },
] as const;

const views: Array<{ value: CaseView; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: "extrajudicial", label: "Pozasądowe" },
  { value: "judicial", label: "Sądowe" },
];

export function ClaimsFilters() {
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

  function handleFilterChange(key: string, value: string) {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      const nextParams = buildClaimsSearchParams(
        new URLSearchParams(paramsString),
        { [key]: value.trim() || null },
      );

      startTransition(() => {
        router.replace(nextParams ? `${pathname}?${nextParams}` : pathname);
      });
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const currentView = (searchParams.get("view") ?? "all") as CaseView;

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-1">
        {views.map((view) => (
          <button
            key={view.value}
            type="button"
            onClick={() =>
              replaceParams({ view: view.value === "all" ? null : view.value })
            }
            className={`rounded px-3 py-2 text-sm font-semibold transition ${
              currentView === view.value
                ? "bg-neutral-950 text-white shadow-sm"
                : "text-neutral-600 hover:bg-white hover:text-neutral-950"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(7,minmax(0,1fr))_auto] xl:items-end">
        {filterFields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {field.label}
            </span>
            <input
              type={field.type}
              key={searchParams.get(field.key) ?? ""}
              defaultValue={searchParams.get(field.key) ?? ""}
              onChange={(event) =>
                handleFilterChange(field.key, event.target.value)
              }
              placeholder={field.placeholder}
              className="mt-1 h-11 w-full cursor-text rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-950"
            />
          </label>
        ))}

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

      {isPending ? (
        <p className="text-xs font-medium text-neutral-500">
          Odświeżam listę spraw...
        </p>
      ) : null}
    </section>
  );
}
