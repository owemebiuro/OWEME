import { TaskStatus } from "@prisma/client";

import { fetchFlightData } from "@/lib/services/flight-api.service";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";
import type {
  OverdueTasksNotificationData,
  UnassignedClaimsNotificationData,
} from "@/lib/inngest/events";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function hoursAgo(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

function dateToIsoString(date: Date | string | null) {
  if (!date) {
    return null;
  }

  return typeof date === "string" ? date : date.toISOString();
}

function dateToFlightApiDate(date: Date | string) {
  return dateToIsoString(date)?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
}

export const overdueTasksAlert = inngest.createFunction(
  {
    id: "overdue-tasks-alert",
    name: "OWEME: alert zaległych zadań",
    triggers: [{ cron: "0 8 * * 1-5" }],
  },
  async ({ step }) => {
    const overdueTasks = await step.run("Pobierz zaległe zadania", () =>
      prisma.task.findMany({
        where: {
          status: TaskStatus.OPEN,
          dueDate: {
            lt: startOfToday(),
          },
          assigneeId: {
            not: null,
          },
          claim: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          assigneeId: true,
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
        orderBy: {
          dueDate: "asc",
        },
      }),
    );

    const grouped = new Map<string, OverdueTasksNotificationData>();

    for (const task of overdueTasks) {
      if (!task.assigneeId) {
        continue;
      }

      const group =
        grouped.get(task.assigneeId) ??
        {
          assigneeId: task.assigneeId,
          taskIds: [],
          tasks: [],
        };

      group.taskIds.push(task.id);
      group.tasks.push({
        id: task.id,
        title: task.title,
        dueDate: dateToIsoString(task.dueDate),
        claimId: task.claim.id,
        claimNumber: task.claim.claimNumber,
        clientName: `${task.claim.client.firstName} ${task.claim.client.lastName}`,
      });
      grouped.set(task.assigneeId, group);
    }

    const notificationEvents = Array.from(grouped.values()).map((data) => ({
      name: "notification/overdue-tasks" as const,
      data,
    }));

    if (notificationEvents.length) {
      await step.sendEvent("Wyślij eventy alertów zaległych zadań", notificationEvents);
    }

    return {
      overdueTasks: overdueTasks.length,
      assignees: notificationEvents.length,
    };
  },
);

export const flightDataRefresh = inngest.createFunction(
  {
    id: "flight-data-refresh",
    name: "OWEME: nocne odświeżenie danych lotów",
    triggers: [{ cron: "0 2 * * *" }],
  },
  async ({ step }) => {
    const flights = await step.run("Znajdź loty do odświeżenia", () =>
      prisma.flight.findMany({
        where: {
          OR: [
            {
              lastApiRefreshAt: null,
            },
            {
              lastApiRefreshAt: {
                lt: hoursAgo(24),
              },
            },
          ],
        },
        select: {
          id: true,
          flightNumber: true,
          flightDate: true,
        },
        orderBy: {
          lastApiRefreshAt: {
            sort: "asc",
            nulls: "first",
          },
        },
        take: 25,
      }),
    );

    const results = await step.run("Odśwież dane lotów", async () => {
      const refreshed: string[] = [];
      const failed: { flightId: string; message: string }[] = [];

      for (const flight of flights) {
        try {
          await fetchFlightData(
            flight.flightNumber,
            dateToFlightApiDate(flight.flightDate),
            {
              forceRefresh: true,
            },
          );
          refreshed.push(flight.id);
        } catch (error) {
          failed.push({
            flightId: flight.id,
            message: error instanceof Error ? error.message : "Nieznany błąd",
          });
        }
      }

      return {
        refreshed,
        failed,
      };
    });

    return results;
  },
);

export const claimOwnerAlert = inngest.createFunction(
  {
    id: "claim-owner-alert",
    name: "OWEME: alert spraw bez opiekuna",
    triggers: [{ cron: "0 9 * * 1-5" }],
  },
  async ({ step }) => {
    const claims = await step.run("Pobierz sprawy bez opiekuna", () =>
      prisma.claim.findMany({
        where: {
          deletedAt: null,
          ownerId: null,
          createdAt: {
            lt: hoursAgo(48),
          },
        },
        select: {
          id: true,
          claimNumber: true,
          source: true,
          createdAt: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 50,
      }),
    );

    if (!claims.length) {
      return {
        unassignedClaims: 0,
      };
    }

    const data: UnassignedClaimsNotificationData = {
      claimIds: claims.map((claim) => claim.id),
      claims: claims.map((claim) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        source: claim.source,
        createdAt: dateToIsoString(claim.createdAt) ?? new Date().toISOString(),
        clientName: `${claim.client.firstName} ${claim.client.lastName}`,
      })),
    };

    await step.sendEvent("Wyślij event alertu spraw bez opiekuna", {
      name: "notification/unassigned-claims",
      data,
    });

    return {
      unassignedClaims: claims.length,
    };
  },
);
