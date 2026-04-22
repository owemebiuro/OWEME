"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { buildClaimsSearchParams } from "@/lib/claims/url-filters";

type ClaimsSavedViewsProps = {
  currentUserId: string;
};

const presetReset = {
  q: null,
  status: null,
  ownerId: null,
  type: null,
  dateFrom: null,
  dateTo: null,
  court: null,
  overdue: null,
};

export function ClaimsSavedViews({ currentUserId }: ClaimsSavedViewsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function applyPreset(updates: Record<string, string | string[] | null>) {
    const nextParams = buildClaimsSearchParams(
      searchParams,
      { ...presetReset, ...updates },
      { resetPage: true },
    );

    startTransition(() => {
      router.push(nextParams ? `${pathname}?${nextParams}` : pathname);
    });
  }

  const presets = [
    {
      label: "Moje sprawy",
      active: searchParams.get("ownerId") === currentUserId,
      onClick: () => applyPreset({ ownerId: currentUserId }),
    },
    {
      label: "Nowe sprawy",
      active: searchParams.get("status") === "NEW",
      onClick: () => applyPreset({ status: ["NEW"] }),
    },
    {
      label: "Braki formalne",
      active: searchParams.get("status") === "MISSING_DATA",
      onClick: () => applyPreset({ status: ["MISSING_DATA"] }),
    },
    {
      label: "Sądowe",
      active: searchParams.get("court") === "1",
      onClick: () => applyPreset({ court: "1" }),
    },
    {
      label: "Po terminie",
      active: searchParams.get("overdue") === "1",
      onClick: () => applyPreset({ overdue: "1" }),
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={preset.onClick}
          disabled={isPending}
          className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold transition ${
            preset.active
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
