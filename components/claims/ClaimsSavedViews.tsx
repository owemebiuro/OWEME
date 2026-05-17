"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { buildClaimsSearchParams } from "@/lib/claims/url-filters";
import styles from "./ClaimsSavedViews.module.css";

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
    <div className={styles.tabs}>
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={preset.onClick}
          disabled={isPending}
          className={`${styles.button} ${preset.active ? styles.buttonActive : ""}`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
