import { UserRole } from "@prisma/client";
import { createElement } from "react";

import { inngest } from "@/lib/inngest/client";
import type {
  OverdueTasksNotificationData,
  UnassignedClaimsNotificationData,
} from "@/lib/inngest/events";
import { prisma } from "@/lib/prisma";
import SystemNotificationEmail from "@/src/emails/system-notification-email";
import { getAppBaseUrl } from "@/src/lib/resend";
import { sendEmail } from "@/src/server/mail/send-email";

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

    const previewText = `Masz ${data.tasks.length} zaległych zadań w OWEME CRM.`;

    return step.run("Wyślij email o zaległych zadaniach", () =>
      sendEmail({
        type: "crm.overdue_tasks",
        to: assignee.email,
        subject: "OWEME CRM: zaległe zadania",
        previewText,
        react: createElement(SystemNotificationEmail, {
          title: "Zaległe zadania",
          intro: `${assignee.name}, w CRM są zadania po terminie wymagające reakcji.`,
          panelUrl: `${getAppBaseUrl()}/crm/tasks`,
          previewText,
          items: data.tasks.map((task) => ({
            label: task.title,
            detail: `${task.claimNumber} - ${task.clientName} - termin: ${task.dueDate}`,
          })),
        }),
        metadata: {
          assigneeId: data.assigneeId,
          taskCount: data.tasks.length,
        },
      }),
    );
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

    const previewText = `W CRM jest ${data.claims.length} spraw bez opiekuna.`;

    return step.run("Wyślij email do administratorów", () =>
      sendEmail({
        type: "crm.unassigned_claims",
        to: admins.map((admin) => admin.email),
        subject: "OWEME CRM: sprawy bez opiekuna",
        previewText,
        react: createElement(SystemNotificationEmail, {
          title: "Sprawy bez opiekuna",
          intro: "W OWEME CRM są sprawy, które nie mają przypisanego opiekuna.",
          panelUrl: `${getAppBaseUrl()}/crm/claims`,
          previewText,
          items: data.claims.map((claim) => ({
            label: claim.claimNumber,
            detail: `${claim.clientName} - ${claim.source} - ${claim.createdAt}`,
          })),
        }),
        metadata: {
          claimCount: data.claims.length,
        },
      }),
    );
  },
);
