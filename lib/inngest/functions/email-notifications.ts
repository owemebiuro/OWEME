import { UserRole } from "@prisma/client";

import { sendEmail } from "@/lib/email";
import {
  overdueTasksEmailTemplate,
  unassignedClaimsEmailTemplate,
} from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";
import type {
  OverdueTasksNotificationData,
  UnassignedClaimsNotificationData,
} from "@/lib/inngest/events";

export const sendOverdueTasksEmail = inngest.createFunction(
  {
    id: "send-overdue-tasks-email",
    name: "OWEME: email o zaległych zadaniach",
    triggers: [{ event: "notification/overdue-tasks" }],
  },
  async ({ event, step }) => {
    const data = event.data as OverdueTasksNotificationData;

    const assignee = await step.run("Pobierz operatora", () =>
      prisma.user.findFirst({
        where: {
          id: data.assigneeId,
          isActive: true,
        },
        select: {
          name: true,
          email: true,
        },
      }),
    );

    if (!assignee) {
      return { skipped: true, reason: "assignee_not_found" };
    }

    const template = overdueTasksEmailTemplate({
      operatorName: assignee.name,
      tasks: data.tasks.map((task) => ({
        title: task.title,
        dueDate: task.dueDate,
        claimNumber: task.claimNumber,
        clientName: task.clientName,
      })),
    });

    const result = await step.run("Wyślij email o zaległych zadaniach", () =>
      sendEmail({
        to: assignee.email,
        subject: template.subject,
        html: template.html,
      }),
    );

    return result;
  },
);

export const sendUnassignedClaimsEmail = inngest.createFunction(
  {
    id: "send-unassigned-claims-email",
    name: "OWEME: email o sprawach bez opiekuna",
    triggers: [{ event: "notification/unassigned-claims" }],
  },
  async ({ event, step }) => {
    const data = event.data as UnassignedClaimsNotificationData;

    const admins = await step.run("Pobierz administratorów", () =>
      prisma.user.findMany({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
        select: {
          email: true,
        },
      }),
    );

    if (!admins.length) {
      return { skipped: true, reason: "admins_not_found" };
    }

    const template = unassignedClaimsEmailTemplate({
      claims: data.claims.map((claim) => ({
        claimNumber: claim.claimNumber,
        source: claim.source,
        createdAt: claim.createdAt,
        clientName: claim.clientName,
      })),
    });

    const result = await step.run("Wyślij email do administratorów", () =>
      sendEmail({
        to: admins.map((admin) => admin.email),
        subject: template.subject,
        html: template.html,
      }),
    );

    return result;
  },
);
