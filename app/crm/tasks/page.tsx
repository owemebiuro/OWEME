import type { Metadata } from "next";
import { TaskStatus } from "@prisma/client";

import { TasksBoard, type TaskBoardItem } from "@/components/tasks/TasksBoard";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Zadania | OWEME CRM",
};

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export default async function TasksPage() {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: {
      status: {
        not: TaskStatus.CANCELLED,
      },
    },
    include: {
      assignee: {
        select: {
          name: true,
        },
      },
      claim: {
        select: {
          id: true,
          claimNumber: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const serializedTasks: TaskBoardItem[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: serializeDate(task.dueDate),
    priority: task.priority,
    status: task.status,
    assignee: task.assignee,
    claim: task.claim,
  }));

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <TasksBoard tasks={serializedTasks} />
      </div>
    </main>
  );
}
