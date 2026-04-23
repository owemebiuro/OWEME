import Link from "next/link";

import { formatDateTime } from "@/lib/claims/format";
import { claimStatusLabels } from "@/lib/claims/status-colors";

type RecentActivityEvent = {
  id: string;
  type: "STATUS_CHANGE";
  description: string;
  comment: string | null;
  createdAt: Date;
  claim: {
    id: string;
    claimNumber: string;
    status: keyof typeof claimStatusLabels;
    client: {
      firstName: string;
      lastName: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type RecentActivityPanelProps = {
  activity: RecentActivityEvent[];
};

function formatDescription(description: string) {
  return description.replace(
    /([A-Z_]+) -> ([A-Z_]+)/,
    (_match, oldStatus: keyof typeof claimStatusLabels, newStatus: keyof typeof claimStatusLabels) =>
      `${claimStatusLabels[oldStatus] ?? oldStatus} → ${
        claimStatusLabels[newStatus] ?? newStatus
      }`,
  );
}

export function RecentActivityPanel({ activity }: RecentActivityPanelProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-neutral-950">
          Ostatnia aktywność
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Najnowsze zmiany statusów w sprawach.
        </p>
      </div>

      <div className="divide-y divide-neutral-100">
        {activity.length ? (
          activity.map((event) => (
            <article key={event.id} className="p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-neutral-950" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-950">
                    {formatDescription(event.description)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    <Link
                      href={`/crm/claims/${event.claim.id}`}
                      prefetch={false}
                      className="font-semibold underline-offset-4 hover:underline"
                    >
                      {event.claim.claimNumber}
                    </Link>{" "}
                    · {event.claim.client.firstName}{" "}
                    {event.claim.client.lastName}
                  </p>
                  {event.comment ? (
                    <p className="mt-2 rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                      {event.comment}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs font-medium text-neutral-500">
                    {event.user.name} · {formatDateTime(event.createdAt.toISOString())}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="font-semibold text-neutral-950">Brak aktywności</p>
            <p className="mt-2 text-sm text-neutral-500">
              Zmiany statusów pojawią się tutaj automatycznie.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
