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
import styles from "./QuickActions.module.css";

type QuickActionsProps = {
  claim: Pick<ClaimsListItem, "id" | "ownerId" | "status">;
  currentUser: ClaimsCurrentUser;
};

type MutationError = {
  message: string;
};

type MutationOptions = {
  onMutate?: () => void;
  onSuccess?: () => void;
  onError?: (error: MutationError) => void;
};

type MutationHandle<TInput> = {
  isPending: boolean;
  mutate: (input: TInput) => void;
};

type ClaimsMutationApi = {
  assignOwner: {
    useMutation: (options: MutationOptions) => MutationHandle<{
      id: string;
      ownerId: string | null;
    }>;
  };
  updateStatus: {
    useMutation: (options: MutationOptions) => MutationHandle<{
      id: string;
      status: ClaimStatus;
    }>;
  };
};

export function QuickActions({ claim, currentUser }: QuickActionsProps) {
  const router = useRouter();
  const claimsApi = api.claims as unknown as ClaimsMutationApi;
  const [selectedStatus, setSelectedStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refreshData() {
    router.refresh();
  }

  const assignOwner = claimsApi.assignOwner.useMutation({
    onMutate: () => setError(null),
    onSuccess: refreshData,
    onError: (mutationError) => setError(mutationError.message),
  });

  const updateStatus = claimsApi.updateStatus.useMutation({
    onMutate: () => setError(null),
    onSuccess: () => {
      setSelectedStatus("");
      refreshData();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  const isLoading = assignOwner.isPending || updateStatus.isPending;
  const canTakeClaim = claim.ownerId === null;

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
    <div className={styles.actions}>
      {canTakeClaim ? (
        <button
          type="button"
          onClick={() =>
            assignOwner.mutate({ id: claim.id, ownerId: currentUser.id })
          }
          disabled={isLoading}
          className={styles.takeButton}
        >
          Weź sprawę
        </button>
      ) : null}

      <select
        value={selectedStatus}
        onChange={(event) => handleStatusChange(event.target.value)}
        disabled={isLoading}
        className={styles.statusSelect}
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

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
