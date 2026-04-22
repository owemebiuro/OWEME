"use client";

import type { ClaimStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/trpc/hooks";
import type { ClaimsCurrentUser, ClaimsListItem } from "@/lib/claims/types";
import {
  CLAIM_STATUSES,
  claimStatusLabels,
} from "@/lib/claims/status-colors";

type QuickActionsProps = {
  claim: Pick<ClaimsListItem, "id" | "ownerId" | "status">;
  currentUser: ClaimsCurrentUser;
};

export function QuickActions({ claim, currentUser }: QuickActionsProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refreshData() {
    void utils.claims.list.invalidate();
    router.refresh();
  }

  const assignOwner = api.claims.assignOwner.useMutation({
    onMutate: () => setError(null),
    onSuccess: refreshData,
    onError: (mutationError) => setError(mutationError.message),
  });

  const updateStatus = api.claims.updateStatus.useMutation({
    onMutate: () => setError(null),
    onSuccess: () => {
      setSelectedStatus("");
      refreshData();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  const isLoading = assignOwner.isPending || updateStatus.isPending;

  function handleStatusChange(status: string) {
    setSelectedStatus(status);

    if (!status || status === claim.status) {
      return;
    }

    updateStatus.mutate({
      id: claim.id,
      status: status as ClaimStatus,
    });
  }

  return (
    <div className="flex min-w-40 flex-col gap-2">
      {claim.ownerId === null ? (
        <button
          type="button"
          onClick={() =>
            assignOwner.mutate({ id: claim.id, ownerId: currentUser.id })
          }
          disabled={isLoading}
          className="inline-flex h-9 items-center justify-center rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:border-teal-400 disabled:cursor-wait disabled:opacity-50"
        >
          Weź sprawę
        </button>
      ) : null}

      <select
        value={selectedStatus}
        onChange={(event) => handleStatusChange(event.target.value)}
        disabled={isLoading}
        className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-700 outline-none transition focus:border-neutral-950 disabled:cursor-wait disabled:opacity-50"
      >
        <option value="">Zmień status</option>
        {CLAIM_STATUSES.filter((status) => status !== claim.status).map(
          (status) => (
            <option key={status} value={status}>
              {claimStatusLabels[status]}
            </option>
          ),
        )}
      </select>

      {error ? (
        <p className="max-w-52 text-xs leading-5 text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
