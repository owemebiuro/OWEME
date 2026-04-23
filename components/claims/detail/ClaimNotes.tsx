"use client";

import type { NoteType } from "@prisma/client";
import { useState } from "react";

import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { noteTypeLabels } from "@/lib/claims/detail-labels";
import { formatDateTime } from "@/lib/claims/format";
import { api } from "@/lib/trpc/hooks";

type ClaimNotesProps = {
  claim: ClaimDetailData;
  onChanged: () => void;
};

const noteTypes = [
  "INTERNAL",
  "OUTGOING_CORRESPONDENCE",
  "INCOMING_CORRESPONDENCE",
  "PHONE_CALL",
  "ESCALATION",
] as const satisfies readonly NoteType[];

type NoteFilter = "all" | "correspondence" | "internal";

function metadataEntries(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  return Object.entries(metadata as Record<string, unknown>);
}

export function ClaimNotes({ claim, onChanged }: ClaimNotesProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("INTERNAL");
  const [filter, setFilter] = useState<NoteFilter>("all");

  const createNote = api.notes.create.useMutation({
    onSuccess: () => {
      setContent("");
      setType("INTERNAL");
      onChanged();
    },
  });

  const filteredNotes = claim.notes.filter((note) => {
    if (filter === "correspondence") {
      return (
        note.type === "OUTGOING_CORRESPONDENCE" ||
        note.type === "INCOMING_CORRESPONDENCE"
      );
    }

    if (filter === "internal") {
      return note.type === "INTERNAL";
    }

    return true;
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">
          Dodaj notatkę
        </h2>
        <form
          className="mt-4 space-y-3"
          data-testid="claim-note-form"
          onSubmit={(event) => {
            event.preventDefault();
            createNote.mutate({
              claimId: claim.id,
              content,
              type,
            });
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">Typ</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as NoteType)}
              className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              {noteTypes.map((noteType) => (
                <option key={noteType} value={noteType}>
                  {noteTypeLabels[noteType]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Treść
            </span>
            <textarea
              value={content}
              data-testid="claim-note-content"
              onChange={(event) => setContent(event.target.value)}
              rows={6}
              className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
              placeholder="Wpisz notatkę do sprawy"
            />
          </label>

          {createNote.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createNote.error.message}
            </p>
          ) : null}

          <button
            type="submit"
            data-testid="claim-note-submit"
            disabled={createNote.isPending || !content.trim()}
            className="h-10 w-full rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Dodaj notatkę
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-neutral-950">Notatki</h2>
          <div className="flex gap-2">
            {[
              ["all", "Wszystkie"],
              ["correspondence", "Korespondencja"],
              ["internal", "Wewnętrzne"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as NoteFilter)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === value
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredNotes.length ? (
            filteredNotes.map((note) => (
              <article
                key={note.id}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700">
                    {noteTypeLabels[note.type]}
                  </span>
                  <span className="text-sm font-semibold text-neutral-950">
                    {note.author.name}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {note.content}
                </p>
                {(note.type === "OUTGOING_CORRESPONDENCE" ||
                  note.type === "INCOMING_CORRESPONDENCE") &&
                metadataEntries(note.metadata).length ? (
                  <dl className="mt-3 grid gap-2 rounded-md border border-neutral-200 bg-white p-3 text-xs sm:grid-cols-2">
                    {metadataEntries(note.metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-semibold uppercase tracking-wide text-neutral-500">
                          {key}
                        </dt>
                        <dd className="mt-1 text-neutral-700">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
              Brak notatek dla wybranego filtra.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
