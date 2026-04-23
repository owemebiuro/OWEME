"use client";

import type { TaskPriority } from "@prisma/client";
import { useState } from "react";

import type { ClaimDetailData } from "@/lib/claims/detail-types";
import {
  taskPriorityClasses,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/lib/claims/detail-labels";
import { formatDate } from "@/lib/claims/format";
import type { ClaimsOwnerOption } from "@/lib/claims/types";
import { api } from "@/lib/trpc/hooks";

type ClaimTasksProps = {
  claim: ClaimDetailData;
  owners: ClaimsOwnerOption[];
  onChanged: () => void;
};

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const satisfies readonly TaskPriority[];

function isOverdue(value: string | null) {
  return value ? new Date(value).getTime() < Date.now() : false;
}

export function ClaimTasks({ claim, owners, onChanged }: ClaimTasksProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      setTitle("");
      setDueDate("");
      setAssigneeId("");
      setPriority("MEDIUM");
      onChanged();
    },
  });

  const closeTask = api.tasks.close.useMutation({
    onSuccess: onChanged,
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">
          Utwórz zadanie
        </h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createTask.mutate({
              claimId: claim.id,
              title,
              dueDate: dueDate || undefined,
              assigneeId: assigneeId || null,
              priority,
            });
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Tytuł
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              placeholder="Co trzeba zrobić?"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Termin
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Przypisz do
            </span>
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              <option value="">Bez przypisania</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Priorytet
            </span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {taskPriorityLabels[item]}
                </option>
              ))}
            </select>
          </label>

          {createTask.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createTask.error.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={createTask.isPending || !title.trim()}
            className="h-10 w-full rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Dodaj zadanie
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">
          Otwarte zadania
        </h2>
        <div className="mt-4 space-y-3">
          {claim.tasks.length ? (
            claim.tasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <label className="flex min-w-0 flex-1 gap-3">
                  <input
                    type="checkbox"
                    disabled={closeTask.isPending}
                    onChange={() => closeTask.mutate({ id: task.id })}
                    className="mt-1 h-4 w-4 accent-neutral-950"
                  />
                  <span>
                    <span className="block font-semibold text-neutral-950">
                      {task.title}
                    </span>
                    {task.description ? (
                      <span className="mt-1 block text-sm text-neutral-500">
                        {task.description}
                      </span>
                    ) : null}
                    <span className="mt-2 block text-sm text-neutral-500">
                      Assignee: {task.assignee?.name ?? "brak"} · Status:{" "}
                      {taskStatusLabels[task.status]}
                    </span>
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${taskPriorityClasses[task.priority]}`}
                  >
                    {taskPriorityLabels[task.priority]}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                      isOverdue(task.dueDate)
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-neutral-200 bg-white text-neutral-600"
                    }`}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
              Brak otwartych zadań.
            </p>
          )}
        </div>

        {closeTask.error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {closeTask.error.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
