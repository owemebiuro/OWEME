import type { ClaimSource, ClaimStatus } from "@prisma/client";

import { inngest } from "@/lib/inngest/client";

export type ClaimCreatedEventData = {
  claimId: string;
};

export type ClaimStatusChangedEventData = {
  claimId: string;
  oldStatus: ClaimStatus;
  newStatus: ClaimStatus;
};

export type OverdueTasksNotificationData = {
  assigneeId: string;
  taskIds: string[];
  tasks: {
    id: string;
    title: string;
    dueDate: string | null;
    claimId: string;
    claimNumber: string;
    clientName: string;
  }[];
};

export type UnassignedClaimsNotificationData = {
  claimIds: string[];
  claims: {
    id: string;
    claimNumber: string;
    source: ClaimSource;
    createdAt: string;
    clientName: string;
  }[];
};

type OwemeEvent =
  | {
      name: "claim/created";
      data: ClaimCreatedEventData;
    }
  | {
      name: "claim/status-changed";
      data: ClaimStatusChangedEventData;
    }
  | {
      name: "notification/overdue-tasks";
      data: OverdueTasksNotificationData;
    }
  | {
      name: "notification/unassigned-claims";
      data: UnassignedClaimsNotificationData;
    };

export async function sendInngestEvent(event: OwemeEvent) {
  try {
    await inngest.send(event);
  } catch (error) {
    console.error("[Inngest] Nie udało się wysłać eventu.", {
      eventName: event.name,
      error,
    });
  }
}
