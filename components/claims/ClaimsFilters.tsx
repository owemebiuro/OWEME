"use client";

import { ClaimStatus, ClaimType } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { buildClaimsSearchParams } from "@/lib/claims/url-filters";
import type { CaseView } from "@/lib/constants/statuses";
import styles from "./ClaimsFilters.module.css";

export type ClaimAirlineFilterOption = {
  id: string;
  name: string;
};

type ClaimsFiltersProps = {
  airlineOptions: ClaimAirlineFilterOption[];
};

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

const typeOptions = [
  { value: "", label: "Wszystkie typy" },
  { value: ClaimType.DELAY, label: "Opóźnienie" },
  { value: ClaimType.CANCELLATION, label: "Odwołanie" },
  { value: ClaimType.DENIED_BOARDING, label: "Overbooking" },
] as const;

const statusOptions = [
  { value: "", label: "Wszystkie statusy", statuses: [] },
  { value: "new", label: "Nowa", statuses: [ClaimStatus.NEW] },
  {
    value: "in_progress",
    label: "W toku",
    statuses: [
      ClaimStatus.AWAITING_VERIFICATION,
      ClaimStatus.MISSING_DATA,
      ClaimStatus.QUALIFIED,
      ClaimStatus.DOCUMENTS_GENERATED,
      ClaimStatus.ASSIGNMENT_SIGNED,
      ClaimStatus.DEMAND_LETTER_PREPARED,
      ClaimStatus.DEMAND_LETTER_SENT,
      ClaimStatus.AWAITING_AIRLINE_RESPONSE,
      ClaimStatus.NEGATIVE_RESPONSE,
    ],
  },
  {
    value: "court_submitted",
    label: "Złożona do sądu",
    statuses: [ClaimStatus.COURT_DECISION_PENDING],
  },
  {
    value: "court_pending",
    label: "Oczekuje na wyrok",
    statuses: [ClaimStatus.COURT_STAGE],
  },
  {
    value: "won",
    label: "Wygrana",
    statuses: [ClaimStatus.WON, ClaimStatus.SETTLEMENT, ClaimStatus.CLOSED_PAID],
  },
  {
    value: "lost",
    label: "Przegrana",
    statuses: [ClaimStatus.REJECTED, ClaimStatus.DISMISSED],
  },
  {
    value: "archive",
    label: "Archiwum",
    statuses: [
      ClaimStatus.WON,
      ClaimStatus.SETTLEMENT,
      ClaimStatus.CLOSED_PAID,
      ClaimStatus.REJECTED,
      ClaimStatus.DISMISSED,
    ],
  },
] as const;

function getStatusSelectValue(statusParam: string | null) {
  const normalized = statusParam ?? "";

  return (
    statusOptions.find((option) => option.statuses.join(",") === normalized)
      ?.value ?? ""
  );
}

function getNextLimitationSort(current: string | null) {
  if (current === "asc") {
    return "desc";
  }

  if (current === "desc") {
    return null;
  }

  return "asc";
}

function getSortLabel(current: string | null) {
  if (current === "asc") {
    return "Przedawnienie ↑";
  }

  if (current === "desc") {
    return "Przedawnienie ↓";
  }

  return "Przedawnienie ↕";
}

export function ClaimsFilters({ airlineOptions }: ClaimsFiltersProps) {
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
  const currentSort = searchParams.get("limitationSort");
  const statusValue = getStatusSelectValue(searchParams.get("status"));

  return (
    <section className={styles.panel}>
      <div className={styles.segment}>
        {views.map((view) => (
          <button
            key={view.value}
            type="button"
            onClick={() =>
              replaceParams({ view: view.value === "all" ? null : view.value })
            }
            className={`${styles.segmentButton} ${
              currentView === view.value ? styles.segmentButtonActive : ""
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        {filterFields.map((field) => (
          <label
            key={field.key}
            className={`${styles.field} ${
              field.type === "date" ? styles.dateField : ""
            }`}
          >
            <span className={styles.label}>{field.label}</span>
            <input
              type={field.type}
              key={searchParams.get(field.key) ?? ""}
              defaultValue={searchParams.get(field.key) ?? ""}
              onChange={(event) =>
                handleFilterChange(field.key, event.target.value)
              }
              placeholder={field.placeholder}
              className={styles.input}
            />
          </label>
        ))}

        <label className={`${styles.field} ${styles.selectField}`}>
          <span className={styles.label}>Linia lotnicza</span>
          <select
            value={searchParams.get("airlineId") ?? ""}
            onChange={(event) =>
              replaceParams({ airlineId: event.target.value || null })
            }
            className={styles.select}
          >
            <option value="">Wszystkie linie</option>
            {airlineOptions.map((airline) => (
              <option key={airline.id} value={airline.id}>
                {airline.name}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.field} ${styles.selectField}`}>
          <span className={styles.label}>Typ sprawy</span>
          <select
            value={searchParams.get("type") ?? ""}
            onChange={(event) =>
              replaceParams({ type: event.target.value || null })
            }
            className={styles.select}
          >
            {typeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.field} ${styles.selectField}`}>
          <span className={styles.label}>Status</span>
          <select
            value={statusValue}
            onChange={(event) => {
              const option = statusOptions.find(
                (item) => item.value === event.target.value,
              );

              replaceParams({ status: option?.statuses ?? null });
            }}
            className={styles.select}
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() =>
            replaceParams({ limitationSort: getNextLimitationSort(currentSort) })
          }
          className={`${styles.sortButton} ${
            currentSort ? styles.sortButtonActive : ""
          }`}
        >
          {getSortLabel(currentSort)}
        </button>

        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.replace(pathname);
            });
          }}
          className={styles.resetButton}
        >
          Resetuj filtry
        </button>
      </div>

      {isPending ? (
        <p className={styles.pending}>Odświeżam listę spraw...</p>
      ) : null}
    </section>
  );
}
