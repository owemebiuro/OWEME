"use client";

import { ClaimStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/trpc/hooks";

type AnalysisActionsProps = {
  claimId: string;
};

type MutationError = {
  message: string;
};

type UpdateStatusMutation = {
  isPending: boolean;
  mutate: (input: {
    id: string;
    status: ClaimStatus;
    comment?: string;
  }) => void;
};

type ClaimsMutationApi = {
  updateStatus: {
    useMutation: (options: {
      onMutate?: () => void;
      onSuccess?: () => void;
      onError?: (error: MutationError) => void;
    }) => UpdateStatusMutation;
  };
};

export function AnalysisActions({ claimId }: AnalysisActionsProps) {
  const router = useRouter();
  const claimsApi = api.claims as unknown as ClaimsMutationApi;
  const [error, setError] = useState<string | null>(null);
  const updateStatus = claimsApi.updateStatus.useMutation({
    onMutate: () => setError(null),
    onSuccess: () => {
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  return (
    <div className="flex min-w-44 flex-col gap-2">
      <button
        type="button"
        disabled={updateStatus.isPending}
        onClick={() =>
          updateStatus.mutate({
            id: claimId,
            status: ClaimStatus.NEW,
            comment: "Wniosek przeanalizowany i przeniesiony do spraw.",
          })
        }
        className="inline-flex h-9 items-center justify-center rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:border-teal-400 disabled:cursor-wait disabled:opacity-50"
      >
        {updateStatus.isPending ? "Przenoszę..." : "Przeanalizowano"}
      </button>
      {error ? <p className="text-xs leading-5 text-red-600">{error}</p> : null}
    </div>
  );
}
