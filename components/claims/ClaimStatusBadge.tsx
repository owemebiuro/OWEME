import type { ClaimStatus, ClaimType } from "@prisma/client";

import {
  claimStatusClasses,
  claimStatusLabels,
  claimTypeLabels,
} from "@/lib/claims/status-colors";

type ClaimStatusBadgeProps = {
  status: ClaimStatus;
};

type ClaimTypeBadgeProps = {
  type: ClaimType;
};

export function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${claimStatusClasses[status]}`}
    >
      {claimStatusLabels[status]}
    </span>
  );
}

export function ClaimTypeBadge({ type }: ClaimTypeBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700">
      {claimTypeLabels[type]}
    </span>
  );
}
