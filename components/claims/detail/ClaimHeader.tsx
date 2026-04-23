"use client";

import { useState } from "react";

import {
  ClaimStatusBadge,
  ClaimTypeBadge,
} from "@/components/claims/ClaimStatusBadge";
import { StatusChangeModal } from "@/components/claims/StatusChangeModal";
import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { formatCurrency, initials } from "@/lib/claims/format";
import type {
  ClaimsCurrentUser,
  ClaimsOwnerOption,
} from "@/lib/claims/types";
import { api } from "@/lib/trpc/hooks";

type ClaimHeaderProps = {
  claim: ClaimDetailData;
  owners: ClaimsOwnerOption[];
  currentUser: ClaimsCurrentUser;
  onRefresh: () => void;
  onOpenNotes: () => void;
  onOpenTasks: () => void;
  onOpenDocuments: () => void;
};

function derivedPriority(claim: ClaimDetailData) {
  if (claim.tasks.some((task) => task.priority === "URGENT")) {
    return "Pilne zadanie";
  }

  if (claim.tasks.some((task) => task.priority === "HIGH")) {
    return "Wysoki priorytet";
  }

  if (claim.isCourtStage) {
    return "Etap sądowy";
  }

  return "Standard";
}

export function ClaimHeader({
  claim,
  owners,
  currentUser,
  onRefresh,
  onOpenNotes,
  onOpenTasks,
  onOpenDocuments,
}: ClaimHeaderProps) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const canChangeOwner = currentUser.role === "ADMIN";
  const assignOwner = api.claims.assignOwner.useMutation({
    onSuccess: onRefresh,
  });

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Karta sprawy
            </p>
            <ClaimTypeBadge type={claim.type} />
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-semibold text-neutral-600">
              {derivedPriority(claim)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              {claim.claimNumber}
            </h1>
            <button type="button" onClick={() => setIsStatusModalOpen(true)}>
              <ClaimStatusBadge status={claim.status} />
            </button>
            {claim.subStatus ? (
              <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
                {claim.subStatus}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto] xl:min-w-[620px]">
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
              {claim.owner ? initials(claim.owner.name) : "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Owner
              </p>
              {canChangeOwner ? (
                <select
                  value={claim.ownerId ?? ""}
                  onChange={(event) =>
                    assignOwner.mutate({
                      id: claim.id,
                      ownerId: event.target.value || null,
                    })
                  }
                  disabled={assignOwner.isPending}
                  className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm font-semibold text-neutral-950 outline-none focus:border-neutral-950 disabled:cursor-wait disabled:opacity-50"
                >
                  <option value="">Nieprzypisana</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {claim.owner?.name ?? "Nieprzypisana"}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm md:w-64">
            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Roszczenie
              </p>
              <p className="mt-1 font-semibold text-neutral-950">
                {formatCurrency(claim.potentialAmount)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Kompletność
              </p>
              <p className="mt-1 font-semibold text-neutral-950">
                {claim.dataCompleteness}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenDocuments}
            className="h-10 rounded-md bg-neutral-950 px-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Wygeneruj dokument
          </button>
          <button
            type="button"
            onClick={onOpenNotes}
            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
          >
            Dodaj notatkę
          </button>
          <button
            type="button"
            onClick={onOpenTasks}
            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
          >
            Utwórz zadanie
          </button>
        </div>
      </div>

      {assignOwner.error ? (
        <p className="mx-auto mt-3 max-w-7xl rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {assignOwner.error.message}
        </p>
      ) : null}

      <StatusChangeModal
        key={`${claim.id}-${claim.status}-${isStatusModalOpen}`}
        claimId={claim.id}
        currentStatus={claim.status}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onChanged={onRefresh}
      />
    </header>
  );
}
