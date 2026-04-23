"use client";

import type { ClaimStatus } from "@prisma/client";
import { useState } from "react";

import {
  CLAIM_STATUSES,
  claimStatusClasses,
  claimStatusLabels,
} from "@/lib/claims/status-colors";
import { api } from "@/lib/trpc/hooks";

type StatusChangeModalProps = {
  claimId: string;
  currentStatus: ClaimStatus;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
};

const criticalStatuses: readonly ClaimStatus[] = ["REJECTED", "DISMISSED"];

export function StatusChangeModal({
  claimId,
  currentStatus,
  isOpen,
  onClose,
  onChanged,
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<ClaimStatus>(currentStatus);
  const [comment, setComment] = useState("");

  const updateStatus = api.claims.updateStatus.useMutation({
    onSuccess: () => {
      setComment("");
      onChanged();
      onClose();
    },
  });

  if (!isOpen) {
    return null;
  }

  const commentRequired = criticalStatuses.includes(selectedStatus);
  const isSubmitDisabled =
    updateStatus.isPending ||
    selectedStatus === currentStatus ||
    (commentRequired && !comment.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
    >
      <div className="w-full max-w-xl rounded-lg border border-neutral-200 bg-white shadow-xl">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2
            id="status-modal-title"
            className="text-lg font-semibold text-neutral-950"
          >
            Zmień status sprawy
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Backend zweryfikuje reguły przejścia statusu.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {CLAIM_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                  selectedStatus === status
                    ? claimStatusClasses[status]
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {claimStatusLabels[status]}
              </button>
            ))}
          </div>

          {criticalStatuses.includes(selectedStatus) ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              Ten status zamyka lub odrzuca sprawę. Dodaj komentarz, żeby
              historia była jednoznaczna.
            </div>
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Komentarz {commentRequired ? "(wymagany)" : "(opcjonalny)"}
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
              placeholder="Dodaj kontekst zmiany statusu"
            />
          </label>

          {updateStatus.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {updateStatus.error.message}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={updateStatus.isPending}
            className="h-10 rounded-md border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-wait disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={() =>
              updateStatus.mutate({
                id: claimId,
                status: selectedStatus,
                comment: comment.trim() || undefined,
              })
            }
            className="h-10 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Zapisz status
          </button>
        </div>
      </div>
    </div>
  );
}
