import "server-only";

import { ClaimStatus } from "@prisma/client";
import { createElement } from "react";

import WelcomeEmail from "@/src/emails/welcome-email";
import { getAppBaseUrl } from "@/src/lib/resend";
import { sendClaimRegisteredEmail } from "@/src/server/mail/send-claim-registered-email";
import { sendClaimStatusEmail } from "@/src/server/mail/send-claim-status-email";
import { sendDocumentRequestEmail } from "@/src/server/mail/send-document-request-email";
import { sendEmail } from "@/src/server/mail/send-email";
import { sendPasswordResetEmail } from "@/src/server/mail/send-password-reset-email";
import { sendWelcomeEmail } from "@/src/server/mail/send-welcome-email";
import type {
  AppEventEnvelope,
  AppEventName,
  AppEventPayload,
  EventDispatchResult,
} from "@/src/server/events/types";

type EventHandler<TName extends AppEventName> = (
  event: AppEventEnvelope<TName>,
) => Promise<unknown>;

function asErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

function getFulfilledHandlerError(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === false
  ) {
    const error = (value as { error?: unknown }).error;

    return error ? asErrorMessage(error) : "Handler returned ok: false.";
  }

  return null;
}

const eventHandlers: {
  [TName in AppEventName]?: Array<EventHandler<TName>>;
} = {
  "claim.created": [
    async (event) =>
      sendClaimRegisteredEmail({
        claimId: event.data.claimId,
      }),
  ],
  "claim.status.changed": [
    async (event) =>
      sendClaimStatusEmail({
        claimId: event.data.claimId,
        oldStatus: event.data.oldStatus,
        newStatus: event.data.newStatus,
      }),
    async (event) => {
      if (event.data.newStatus !== ClaimStatus.MISSING_DATA) {
        return { skipped: true, reason: "status_does_not_request_documents" };
      }

      return sendDocumentRequestEmail({
        claimId: event.data.claimId,
      });
    },
  ],
  "claim.documents.requested": [
    async (event) =>
      sendDocumentRequestEmail({
        claimId: event.data.claimId,
        requestedDocuments: event.data.requestedDocuments,
      }),
  ],
  "auth.user.created": [
    async (event) =>
      sendWelcomeEmail({
        userId: event.data.userId,
        email: event.data.email,
        name: event.data.name,
        role: event.data.role,
        panelUrl: event.data.panelUrl,
      }),
  ],
  "auth.password.reset.requested": [
    async (event) =>
      sendPasswordResetEmail({
        userId: event.data.userId,
        email: event.data.email,
        name: event.data.name,
        resetUrl: event.data.resetUrl,
      }),
  ],
  "system.email.test": [
    async (event) => {
      const panelUrl = `${getAppBaseUrl()}/login`;

      return sendEmail({
        type: "system.test",
        to: event.data.to,
        subject: "OWEME: test integracji Resend",
        previewText: "Testowy email transakcyjny OWEME.",
        react: createElement(WelcomeEmail, {
          name: "Administratorze",
          email: event.data.to,
          role: "TEST",
          panelUrl,
          previewText: "Testowy email transakcyjny OWEME.",
        }),
        metadata: {
          requestedById: event.data.requestedById,
          source: "internal_resend_route",
        },
      });
    },
  ],
};

export async function dispatchEvent<TName extends AppEventName>(
  event: AppEventEnvelope<TName>,
): Promise<EventDispatchResult> {
  const handlers =
    (eventHandlers[event.name] as Array<EventHandler<TName>> | undefined) ?? [];

  const results = await Promise.allSettled(
    handlers.map((handler) => handler(event)),
  );
  const errors = results.flatMap((result) => {
    if (result.status === "rejected") {
      return [asErrorMessage(result.reason)];
    }

    const handlerError = getFulfilledHandlerError(result.value);

    return handlerError ? [handlerError] : [];
  });

  if (errors.length) {
    console.error("[EVENT_ERROR] Event handler failure.", {
      eventId: event.id,
      name: event.name,
      errors,
    });
  }

  return {
    ok: errors.length === 0,
    eventId: event.id,
    handlerCount: handlers.length,
    errors,
  };
}

export type EventPayload<TName extends AppEventName> = AppEventPayload<TName>;
