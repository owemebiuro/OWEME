"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { buildClientsSearchParams } from "@/lib/clients/url-filters";

const filterFields = [
  { key: "firstName", label: "Imię", placeholder: "Jan" },
  { key: "lastName", label: "Nazwisko", placeholder: "Kowalski" },
  { key: "email", label: "Email", placeholder: "jan@example.com" },
  { key: "phone", label: "Telefon", placeholder: "+48 123" },
  { key: "pesel", label: "PESEL", placeholder: "900101" },
] as const;

export function ClientsFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const searchTimeoutRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function replaceParams(params: URLSearchParams) {
    startTransition(() => {
      router.replace(params.toString() ? `${pathname}?${params}` : pathname);
    });
  }

  function handleFilterChange(key: string, value: string) {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      const nextParams = buildClientsSearchParams(
        new URLSearchParams(paramsString),
        { [key]: value.trim() || null },
      );

      replaceParams(new URLSearchParams(nextParams));
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto] xl:items-end">
        {filterFields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {field.label}
            </span>
            <input
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
            startTransition(() => router.replace(pathname));
          }}
          className="h-11 rounded-md border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
        >
          Reset
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Szybkie wyszukiwanie
        </span>
        <input
          key={searchParams.get("q") ?? ""}
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(event) => handleFilterChange("q", event.target.value)}
          placeholder="Dowolny fragment danych klienta"
          className="mt-1 h-11 w-full cursor-text rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-950"
        />
      </label>

      {isPending ? (
        <p className="mt-3 text-xs font-medium text-neutral-500">
          Odświeżam listę klientów...
        </p>
      ) : null}
    </section>
  );
}
