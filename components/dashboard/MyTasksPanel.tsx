import type { TaskPriority } from "@prisma/client";
import Link from "next/link";

import { formatDate } from "@/lib/claims/format";

type DashboardTask = {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: TaskPriority;
  claim: {
    id: string;
    claimNumber: string;
    client: {
      firstName: string;
      lastName: string;
    };
  };
};

type MyTasksPanelProps = {
  tasks: DashboardTask[];
};

const priorityClasses: Record<TaskPriority, string> = {
  LOW: "border-neutral-200 bg-neutral-50 text-neutral-600",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-700",
  HIGH: "border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] text-[var(--ember-lo)]",
  URGENT: "border-red-200 bg-red-50 text-red-700",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Niski",
  MEDIUM: "Średni",
  HIGH: "Wysoki",
  URGENT: "Pilny",
};

function isOverdue(date: Date | null) {
  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function MyTasksPanel({ tasks }: MyTasksPanelProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-neutral-950">
          Moje zadania na dziś
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Najbliższe otwarte zadania przypisane do Ciebie.
        </p>
      </div>

      <div className="divide-y divide-neutral-100">
        {tasks.length ? (
          tasks.map((task) => {
            const overdue = isOverdue(task.dueDate);

            return (
              <article key={task.id} className="p-5 transition hover:bg-neutral-50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/crm/claims/${task.claim.id}`}
                      className="text-sm font-semibold text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {task.title}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-600">
                      {task.claim.claimNumber} · {task.claim.client.firstName}{" "}
                      {task.claim.client.lastName}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${
                      priorityClasses[task.priority]
                    }`}
                  >
                    {priorityLabels[task.priority]}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm font-medium ${
                    overdue ? "text-red-700" : "text-neutral-500"
                  }`}
                >
                  Termin: {task.dueDate ? formatDate(task.dueDate.toISOString()) : "Brak terminu"}
                </p>
              </article>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <p className="font-semibold text-neutral-950">Brak pilnych zadań</p>
            <p className="mt-2 text-sm text-neutral-500">
              Lista pokaże najbliższe otwarte zadania, gdy zostaną przypisane.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
