"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { buildClientsSearchParams } from "@/lib/clients/url-filters";

type ClientsPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function pageWindow(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function ClientsPagination({
  page,
  pageSize,
  total,
  totalPages,
}: ClientsPaginationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const pages = pageWindow(page, Math.max(totalPages, 1));

  function pushUpdates(
    updates: Record<string, string | number | null | undefined>,
    resetPage = false,
  ) {
    const nextParams = buildClientsSearchParams(searchParams, updates, {
      resetPage,
    });

    startTransition(() => {
      router.push(nextParams ? `${pathname}?${nextParams}` : pathname);
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between">
      <p>
        Wyniki: <span className="font-semibold text-neutral-950">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span>Na stronie</span>
          <select
            value={pageSize}
            onChange={(event) =>
              pushUpdates({ pageSize: event.target.value, page: null }, true)
            }
            className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm font-semibold text-neutral-950 outline-none focus:border-neutral-950"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => pushUpdates({ page: page - 1 })}
          disabled={page <= 1 || isPending}
          className="h-9 rounded-md border border-neutral-200 bg-white px-3 font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Poprzednia
        </button>

        <div className="flex items-center gap-1">
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => pushUpdates({ page: pageNumber })}
              disabled={pageNumber === page || isPending}
              className={`h-9 min-w-9 rounded-md border px-3 font-semibold transition ${
                pageNumber === page
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => pushUpdates({ page: page + 1 })}
          disabled={page >= totalPages || isPending}
          className="h-9 rounded-md border border-neutral-200 bg-white px-3 font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Następna
        </button>
      </div>
    </div>
  );
}
