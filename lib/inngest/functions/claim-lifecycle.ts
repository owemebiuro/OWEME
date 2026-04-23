import { ClaimStatus, TaskPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";
import type {
  ClaimCreatedEventData,
  ClaimStatusChangedEventData,
} from "@/lib/inngest/events";
import {
  createInternalNoteIfMissing,
  createTaskIfMissing,
} from "@/lib/inngest/functions/helpers";
import { claimSourceLabels } from "@/lib/claims/status-colors";

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export const onClaimCreated = inngest.createFunction(
  {
    id: "on-claim-created",
    name: "OWEME: obsługa utworzonej sprawy",
    triggers: [{ event: "claim/created" }],
  },
  async ({ event, step }) => {
    const { claimId } = event.data as ClaimCreatedEventData;

    const claim = await step.run("Pobierz sprawę", () =>
      prisma.claim.findFirst({
        where: {
          id: claimId,
          deletedAt: null,
        },
        select: {
          id: true,
          source: true,
          status: true,
          flightId: true,
          ownerId: true,
          creatorId: true,
          isPolishJurisdiction: true,
        },
      }),
    );

    if (!claim) {
      return { skipped: true, reason: "claim_not_found" };
    }

    if (!claim.flightId) {
      await step.run("Utwórz zadanie uzupełnienia lotu", () =>
        createTaskIfMissing(prisma, {
          claimId: claim.id,
          creatorId: claim.creatorId,
          assigneeId: claim.ownerId ?? claim.creatorId,
          title: "Wprowadź dane lotu",
          priority: TaskPriority.HIGH,
        }),
      );
    }

    if (!claim.isPolishJurisdiction && claim.status !== ClaimStatus.REJECTED) {
      await step.run("Odrzuć sprawę poza jurysdykcją", async () => {
        await prisma.$transaction(async (tx) => {
          await tx.claim.update({
            where: {
              id: claim.id,
            },
            data: {
              status: ClaimStatus.REJECTED,
              closedAt: new Date(),
              closeReason: "Automatyczne odrzucenie: sprawa poza polską jurysdykcją.",
            },
          });

          await tx.claimStatusHistory.create({
            data: {
              claimId: claim.id,
              changedById: claim.creatorId,
              oldStatus: claim.status,
              newStatus: ClaimStatus.REJECTED,
              comment:
                "Automatyczne odrzucenie: sprawa poza polską jurysdykcją.",
            },
          });
        });
      });

      await step.run("Dodaj notatkę o automatycznym odrzuceniu", () =>
        createInternalNoteIfMissing(prisma, {
          claimId: claim.id,
          authorId: claim.creatorId,
          content:
            "Sprawa została automatycznie odrzucona, ponieważ nie spełnia kryterium polskiej jurysdykcji.",
        }),
      );
    }

    await step.run("Dodaj notatkę źródła sprawy", () =>
      createInternalNoteIfMissing(prisma, {
        claimId: claim.id,
        authorId: claim.creatorId,
        content: `Sprawa utworzona ze źródła: ${
          claimSourceLabels[claim.source]
        }`,
      }),
    );

    return { ok: true };
  },
);

export const onClaimStatusChanged = inngest.createFunction(
  {
    id: "on-claim-status-changed",
    name: "OWEME: automatyzacje po zmianie statusu",
    triggers: [{ event: "claim/status-changed" }],
  },
  async ({ event, step }) => {
    const { claimId, newStatus } = event.data as ClaimStatusChangedEventData;

    const claim = await step.run("Pobierz sprawę", () =>
      prisma.claim.findFirst({
        where: {
          id: claimId,
          deletedAt: null,
        },
        select: {
          id: true,
          ownerId: true,
          creatorId: true,
        },
      }),
    );

    if (!claim) {
      return { skipped: true, reason: "claim_not_found" };
    }

    const assigneeId = claim.ownerId ?? claim.creatorId;

    if (newStatus === ClaimStatus.QUALIFIED) {
      await step.run("Utwórz zadania po kwalifikacji", async () => {
        await createTaskIfMissing(prisma, {
          claimId: claim.id,
          creatorId: claim.creatorId,
          assigneeId,
          title: "Wygeneruj cesję",
          dueDate: addDays(2),
          priority: TaskPriority.HIGH,
        });
        await createTaskIfMissing(prisma, {
          claimId: claim.id,
          creatorId: claim.creatorId,
          assigneeId,
          title: "Skompletuj dokumenty pasażerów",
          dueDate: addDays(5),
          priority: TaskPriority.MEDIUM,
        });
      });
    }

    if (newStatus === ClaimStatus.DEMAND_LETTER_SENT) {
      await step.run("Utwórz zadanie kontroli odpowiedzi linii", () =>
        createTaskIfMissing(prisma, {
          claimId: claim.id,
          creatorId: claim.creatorId,
          assigneeId,
          title: "Sprawdź odpowiedź linii",
          dueDate: addDays(14),
          priority: TaskPriority.HIGH,
        }),
      );
    }

    return { ok: true };
  },
);
