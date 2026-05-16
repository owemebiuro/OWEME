"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { api } from "@/lib/trpc/hooks";

export type TaskBoardItem = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: {
    name: string;
  } | null;
  claim: {
    id: string;
    claimNumber: string;
    client: {
      firstName: string;
      lastName: string;
    };
  };
};

type TasksBoardProps = {
  tasks: TaskBoardItem[];
};

const priorityStyles: Record<
  TaskPriority,
  { label: string; color: string; bg: string }
> = {
  URGENT: { label: "Pilne", color: "#d04040", bg: "#fee2e2" },
  HIGH: { label: "Wysoki", color: "#1259a8", bg: "#ebf3fe" },
  MEDIUM: { label: "Średni", color: "#1e8a6e", bg: "#e4f5f1" },
  LOW: { label: "Niski", color: "#6b7a94", bg: "#f0f4fa" },
};

const groupOrder = [
  "Przeterminowane",
  "Dzisiaj",
  "Jutro",
  "Ten tydzień",
  "Później",
] as const;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);

  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sameDay(first: Date, second: Date) {
  return dateKey(first) === dateKey(second);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);

  return copy;
}

function endOfWeek(date: Date) {
  const copy = startOfDay(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() + (7 - day));

  return copy;
}

function groupTask(task: TaskBoardItem) {
  if (!task.dueDate) {
    return "Później";
  }

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const dueDate = startOfDay(new Date(task.dueDate));

  if (dueDate < today && task.status !== "DONE") {
    return "Przeterminowane";
  }

  if (sameDay(dueDate, today)) {
    return "Dzisiaj";
  }

  if (sameDay(dueDate, tomorrow)) {
    return "Jutro";
  }

  if (dueDate <= endOfWeek(today)) {
    return "Ten tydzień";
  }

  return "Później";
}

function formatDate(value: string | null) {
  if (!value) {
    return "bez terminu";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function buildCalendar(month: Date, tasks: TaskBoardItem[], selectedDate: string) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() || 7) - 1));
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const counts = new Map<string, number>();

  for (const task of tasks) {
    if (task.dueDate) {
      const key = task.dueDate.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return days.map((day) => ({
    date: day,
    key: dateKey(day),
    taskCount: counts.get(dateKey(day)) ?? 0,
    isToday: sameDay(day, new Date()),
    isSelected: selectedDate === dateKey(day),
    isCurrentMonth: day.getMonth() === month.getMonth(),
  }));
}

export function TasksBoard({ tasks }: TasksBoardProps) {
  const [items, setItems] = useState(tasks);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const closeTask = api.tasks.close.useMutation({
    onSuccess: (_data, variables) => {
      setItems((current) =>
        current.map((task) =>
          task.id === variables.id ? { ...task, status: "DONE" } : task,
        ),
      );
    },
  });

  const visibleTasks = selectedDate
    ? items.filter((task) => task.dueDate?.slice(0, 10) === selectedDate)
    : items;
  const grouped = useMemo(() => {
    const map = new Map<string, TaskBoardItem[]>();

    for (const task of visibleTasks) {
      const group = groupTask(task);
      map.set(group, [...(map.get(group) ?? []), task]);
    }

    return map;
  }, [visibleTasks]);
  const calendar = buildCalendar(month, items, selectedDate ?? "");
  const urgentTasks = visibleTasks.filter((task) =>
    ["URGENT", "HIGH"].includes(task.priority),
  );

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
          Zadania
        </h1>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.6fr)_minmax(320px,0.4fr)]">
        <div className="space-y-4">
          {groupOrder.map((group) => {
            const groupTasks = grouped.get(group) ?? [];

            if (!groupTasks.length) {
              return null;
            }

            return (
              <section
                key={group}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-950">
                    {group}
                  </h2>
                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
                    {groupTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {groupTasks.map((task) => {
                    const style = priorityStyles[task.priority];

                    return (
                      <article
                        key={task.id}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-950">
                              {task.title}
                            </p>
                            <p className="mt-1 text-sm text-neutral-500">
                              Sprawa: {task.claim.claimNumber} ·{" "}
                              {task.claim.client.firstName}{" "}
                              {task.claim.client.lastName}
                            </p>
                            <p className="mt-1 text-sm text-neutral-500">
                              Przypisany: {task.assignee?.name ?? "brak"} · Do:{" "}
                              {formatDate(task.dueDate)}
                            </p>
                          </div>
                          <span
                            className="rounded-md px-2 py-1 text-xs font-semibold"
                            style={{
                              background: style.bg,
                              color: style.color,
                            }}
                          >
                            {style.label}
                          </span>
                        </div>
                        {task.status !== "DONE" ? (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => closeTask.mutate({ id: task.id })}
                              disabled={closeTask.isPending}
                              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-wait disabled:opacity-50"
                            >
                              ✓ Zakończ
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                className="h-8 w-8 rounded-md border border-neutral-200 bg-neutral-50 font-semibold"
              >
                ‹
              </button>
              <h2 className="text-sm font-semibold text-neutral-950">
                {new Intl.DateTimeFormat("pl-PL", {
                  month: "long",
                  year: "numeric",
                }).format(month)}
              </h2>
              <button
                type="button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                className="h-8 w-8 rounded-md border border-neutral-200 bg-neutral-50 font-semibold"
              >
                ›
              </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-500">
              {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "N"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendar.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() =>
                    setSelectedDate((current) =>
                      current === day.key ? null : day.key,
                    )
                  }
                  className={`relative aspect-square rounded-md text-sm font-semibold transition ${
                    day.isSelected
                      ? "bg-[var(--crm-ember,#1b6fd4)] text-white"
                      : day.isToday
                        ? "bg-[var(--ember-bg)] text-[var(--ember-lo)]"
                        : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  } ${day.isCurrentMonth ? "" : "opacity-40"}`}
                >
                  {day.date.getDate()}
                  {day.taskCount ? (
                    <span className="absolute bottom-1 left-1/2 min-w-4 -translate-x-1/2 rounded-full bg-[var(--crm-ember,#1b6fd4)] px-1 text-[9px] leading-3 text-white">
                      {day.taskCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-950">Pilne</h2>
            <div className="mt-3 space-y-2">
              {urgentTasks.length ? (
                urgentTasks.map((task) => {
                  const style = priorityStyles[task.priority];

                  return (
                    <div
                      key={task.id}
                      className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-neutral-950">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatDate(task.dueDate)} ·{" "}
                        <span style={{ color: style.color }}>
                          {style.label}
                        </span>
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-neutral-500">Brak pilnych zadań.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
