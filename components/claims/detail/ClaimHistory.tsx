import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { formatDateTime } from "@/lib/claims/format";
import type { ClaimsOwnerOption } from "@/lib/claims/types";
import { claimStatusLabels } from "@/lib/claims/status-colors";

type ClaimHistoryProps = {
  claim: ClaimDetailData;
  owners: ClaimsOwnerOption[];
};

type HistoryEvent = {
  id: string;
  kind: "status" | "assignment" | "escalation";
  title: string;
  description: string;
  author: string;
  createdAt: string;
};

const kindClasses: Record<HistoryEvent["kind"], string> = {
  status: "bg-blue-500",
  assignment: "bg-teal-500",
  escalation: "bg-red-500",
};

export function ClaimHistory({ claim, owners }: ClaimHistoryProps) {
  const ownerNames = new Map(owners.map((owner) => [owner.id, owner.name]));
  const events: HistoryEvent[] = [
    ...claim.statusHistory.map((entry) => ({
      id: `status-${entry.id}`,
      kind: "status" as const,
      title: "Zmiana statusu",
      description: `${claimStatusLabels[entry.oldStatus]} → ${claimStatusLabels[entry.newStatus]}${
        entry.comment ? ` · ${entry.comment}` : ""
      }`,
      author: entry.changedBy.name,
      createdAt: entry.createdAt,
    })),
    ...claim.assignmentHistory.map((entry) => ({
      id: `assignment-${entry.id}`,
      kind: "assignment" as const,
      title: "Zmiana ownera",
      description: `${entry.previousOwnerId ? ownerNames.get(entry.previousOwnerId) ?? "Poprzedni owner" : "Nieprzypisana"} → ${
        entry.newOwnerId ? ownerNames.get(entry.newOwnerId) ?? "Nowy owner" : "Nieprzypisana"
      }`,
      author: entry.changedBy.name,
      createdAt: entry.createdAt,
    })),
    ...claim.notes
      .filter((note) => note.type === "ESCALATION")
      .map((note) => ({
        id: `escalation-${note.id}`,
        kind: "escalation" as const,
        title: "Eskalacja",
        description: note.content,
        author: note.author.name,
        createdAt: note.createdAt,
      })),
  ].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-950">Historia</h2>
      <div className="mt-4 space-y-3">
        {events.length ? (
          events.map((event) => (
            <article
              key={event.id}
              className="grid grid-cols-[20px_1fr] gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
            >
              <span
                className={`mt-1 h-3 w-3 rounded-full ${kindClasses[event.kind]}`}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-neutral-950">
                    {event.title}
                  </p>
                  <span className="text-sm text-neutral-500">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-neutral-700">
                  {event.description}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {event.author}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
            Historia sprawy jest jeszcze pusta.
          </p>
        )}
      </div>
    </section>
  );
}
