"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/trpc/hooks";
import styles from "./TasksBoard.module.css";

export type TaskBoardItem = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  closedAt: string | null;
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

type TaskSegment = "pending" | "done";

const completedTasksStorageKey = "oweme_completed_tasks";

const priorityLabels: Record<TaskPriority, string> = {
  URGENT: "Pilne",
  HIGH: "Wysoki",
  MEDIUM: "Średni",
  LOW: "Niski",
};

const priorityClassNames: Record<TaskPriority, string> = {
  URGENT: styles.priorityUrgent,
  HIGH: styles.priorityHigh,
  MEDIUM: styles.priorityMedium,
  LOW: styles.priorityLow,
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

function readStoredCompletedIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(completedTasksStorageKey) ?? "[]",
    );

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function getInitialCompletedIds(tasks: TaskBoardItem[]) {
  return uniqueIds([
    ...readStoredCompletedIds(),
    ...tasks.filter((task) => task.status === "DONE").map((task) => task.id),
  ]);
}

function RestoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5.2 7.2A5.5 5.5 0 1 1 4.5 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5.2 4.2v3h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TasksBoard({ tasks }: TasksBoardProps) {
  const [items, setItems] = useState(tasks);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<TaskSegment>("pending");
  const [closingTaskIds, setClosingTaskIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState(() =>
    getInitialCompletedIds(tasks),
  );
  const closeTask = api.tasks.close.useMutation();
  const reopenTask = api.tasks.reopen.useMutation();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      completedTasksStorageKey,
      JSON.stringify(completedIds),
    );
  }, [completedIds]);

  function isCompleted(task: TaskBoardItem) {
    return task.status === "DONE" || completedIds.includes(task.id);
  }

  function completeTask(taskId: string) {
    setClosingTaskIds((current) => uniqueIds([taskId, ...current]));

    window.setTimeout(() => {
      setItems((current) =>
        current.map((task) =>
          task.id === taskId
            ? { ...task, status: "DONE", closedAt: new Date().toISOString() }
            : task,
        ),
      );
      setCompletedIds((current) =>
        uniqueIds([taskId, ...current.filter((id) => id !== taskId)]),
      );
      setClosingTaskIds((current) => current.filter((id) => id !== taskId));
      closeTask.mutate({ id: taskId });
    }, 300);
  }

  function restoreTask(taskId: string) {
    setItems((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: "OPEN", closedAt: null } : task,
      ),
    );
    setCompletedIds((current) => current.filter((id) => id !== taskId));
    reopenTask.mutate({ id: taskId });
  }

  const pendingTasks = items.filter((task) => !isCompleted(task));
  const completedTasks = items
    .filter((task) => isCompleted(task))
    .sort((first, second) => {
      const firstIndex = completedIds.indexOf(first.id);
      const secondIndex = completedIds.indexOf(second.id);

      if (firstIndex !== -1 || secondIndex !== -1) {
        return (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) -
          (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex);
      }

      return (
        new Date(second.closedAt ?? 0).getTime() -
        new Date(first.closedAt ?? 0).getTime()
      );
    });

  const visiblePendingTasks = selectedDate
    ? pendingTasks.filter((task) => task.dueDate?.slice(0, 10) === selectedDate)
    : pendingTasks;
  const grouped = useMemo(() => {
    const map = new Map<string, TaskBoardItem[]>();

    for (const task of visiblePendingTasks) {
      const group = groupTask(task);
      map.set(group, [...(map.get(group) ?? []), task]);
    }

    return map;
  }, [visiblePendingTasks]);
  const calendar = buildCalendar(month, pendingTasks, selectedDate ?? "");
  const urgentTasks = visiblePendingTasks.filter((task) =>
    ["URGENT", "HIGH"].includes(task.priority),
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Zadania
          </h1>
        </div>
        <div className={styles.segments} aria-label="Widok zadań">
          <button
            type="button"
            onClick={() => setActiveSegment("pending")}
            className={`${styles.segmentButton} ${
              activeSegment === "pending" ? styles.segmentButtonActive : ""
            }`}
          >
            Do wykonania
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment("done")}
            className={`${styles.segmentButton} ${
              activeSegment === "done" ? styles.segmentButtonActive : ""
            }`}
          >
            Wykonane
          </button>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.6fr)_minmax(320px,0.4fr)]">
        <div className="space-y-4">
          {activeSegment === "pending" ? (
            <>
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
                      {groupTasks.map((task) => (
                        <article
                          key={task.id}
                          className={`${styles.taskCard} ${
                            closingTaskIds.includes(task.id)
                              ? styles.taskCardClosing
                              : ""
                          }`}
                        >
                          <div className={styles.taskBody}>
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked="false"
                              aria-label={`Oznacz zadanie "${task.title}" jako wykonane`}
                              onClick={() => completeTask(task.id)}
                              disabled={closingTaskIds.includes(task.id)}
                              className={styles.checkbox}
                            >
                              ✓
                            </button>
                            <div className={styles.taskContent}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className={styles.taskTitle}>
                                    {task.title}
                                  </p>
                                  <p className={styles.taskMeta}>
                                    Sprawa: {task.claim.claimNumber} ·{" "}
                                    {task.claim.client.firstName}{" "}
                                    {task.claim.client.lastName}
                                  </p>
                                  <p className={styles.taskMeta}>
                                    Przypisany: {task.assignee?.name ?? "brak"} · Do:{" "}
                                    {formatDate(task.dueDate)}
                                  </p>
                                </div>
                                <span
                                  className={`${styles.priority} ${
                                    priorityClassNames[task.priority]
                                  }`}
                                >
                                  {priorityLabels[task.priority]}
                                </span>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
              {!visiblePendingTasks.length ? (
                <p className={styles.emptyDone}>Brak zadań do wykonania</p>
              ) : null}
            </>
          ) : (
            <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              {completedTasks.length ? (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <article key={task.id} className={styles.taskCard}>
                      <div className={styles.taskBody}>
                        <span
                          role="checkbox"
                          aria-checked="true"
                          aria-disabled="true"
                          className={`${styles.checkbox} ${styles.checkboxChecked}`}
                        >
                          ✓
                        </span>
                        <div className={styles.taskContent}>
                          <p className={`${styles.taskTitle} ${styles.taskTitleDone}`}>
                            {task.title}
                          </p>
                          <p className={styles.taskMeta}>
                            Sprawa: {task.claim.claimNumber} ·{" "}
                            {task.claim.client.firstName} {task.claim.client.lastName}
                          </p>
                          <p className={styles.taskMeta}>
                            Wykonano: {formatDate(task.closedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => restoreTask(task.id)}
                          disabled={reopenTask.isPending}
                          className={styles.restoreButton}
                          aria-label={`Przywróć zadanie "${task.title}"`}
                          title="Przywróć"
                        >
                          <RestoreIcon />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyDone}>Brak wykonanych zadań</p>
              )}
            </section>
          )}
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
                urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-neutral-950">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDate(task.dueDate)} ·{" "}
                      <span
                        className={`${styles.priority} ${
                          priorityClassNames[task.priority]
                        }`}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </p>
                  </div>
                ))
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
