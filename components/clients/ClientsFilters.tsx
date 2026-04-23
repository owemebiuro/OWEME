"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { buildClientsSearchParams } from "@/lib/clients/url-filters";

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

  function handleSearchChange(value: string) {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      const nextParams = buildClientsSearchParams(
        new URLSearchParams(paramsString),
        { q: value.trim() || null },
      );

      replaceParams(new URLSearchParams(nextParams));
    }, 300);
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <label className="block md:min-w-[360px]">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Szukaj klienta
          </span>
          <input
            key={searchParams.get("q") ?? ""}
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Imię, nazwisko, email lub telefon"
            className="mt-1 h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
          />
        </label>

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

      {isPending ? (
        <p className="mt-3 text-xs font-medium text-neutral-500">
          Odświeżam listę klientów...
        </p>
      ) : null}
    </section>
  );
}
