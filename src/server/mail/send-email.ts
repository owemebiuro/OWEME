import "server-only";

import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";
import type { CreateEmailOptions } from "resend";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getResendClient, getResendFromAddress } from "@/src/lib/resend";
import type { TransactionalEmailType } from "@/src/server/mail/templates";

type JsonRecord = Record<string, unknown>;
type EmailLogMetadata = Prisma.InputJsonObject;

export type SendTransactionalEmailInput = {
  type: TransactionalEmailType;
  to: string | string[];
  subject: string;
  react: ReactNode;
  previewText?: string;
  metadata?: JsonRecord;
  replyTo?: string | string[];
  idempotencyKey?: string;
};

export type SendTransactionalEmailResult =
  | {
      ok: true;
      id: string;
      logId: string | null;
    }
  | {
      ok: false;
      error: string;
      logId: string | null;
    };

const emailSchema = z.string().trim().email().toLowerCase();
const recipientSchema = z
  .union([emailSchema, z.array(emailSchema).min(1).max(50)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_WINDOW = 20;
const MAX_SEND_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

function toSerializableMetadata(metadata: JsonRecord | undefined): EmailLogMetadata {
  return JSON.parse(JSON.stringify(metadata ?? {})) as EmailLogMetadata;
}

function createIdempotencyKey(input: {
  type: TransactionalEmailType;
  recipients: string[];
  subject: string;
  metadata: EmailLogMetadata;
}) {
  const fingerprint = JSON.stringify({
    type: input.type,
    recipients: input.recipients,
    subject: input.subject,
    claimId: input.metadata.claimId,
    userId: input.metadata.userId,
    oldStatus: input.metadata.oldStatus,
    newStatus: input.metadata.newStatus,
    resetTokenHash: input.metadata.resetTokenHash,
  });
  const hash = crypto.createHash("sha256").update(fingerprint).digest("hex").slice(0, 32);

  return `oweme-${hash}`;
}

function assertWithinRateLimit(type: TransactionalEmailType, recipients: string[]) {
  const now = Date.now();

  for (const recipient of recipients) {
    const key = `${type}:${recipient}`;
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
      continue;
    }

    if (bucket.count >= RATE_LIMIT_MAX_PER_WINDOW) {
      throw new Error(`Rate limit exceeded for ${recipient}.`);
    }

    bucket.count += 1;
  }
}

async function createEmailLog(input: {
  type: TransactionalEmailType;
  recipients: string[];
  subject: string;
  metadata: EmailLogMetadata;
}) {
  try {
    const log = await prisma.emailLog.create({
      data: {
        type: input.type,
        recipientEmail: input.recipients.join(","),
        subject: input.subject,
        status: "QUEUED",
        metadata: input.metadata,
      },
      select: {
        id: true,
      },
    });

    return log.id;
  } catch (error) {
    console.error("[MAIL_ERROR] Nie udało się zapisać logu email.", {
      error,
      type: input.type,
      recipients: input.recipients,
    });

    return null;
  }
}

async function updateEmailLog(input: {
  logId: string | null;
  status: "SENT" | "FAILED";
  resendEmailId?: string;
  errorMessage?: string;
  metadata: EmailLogMetadata;
}) {
  if (!input.logId) {
    return;
  }

  try {
    await prisma.emailLog.update({
      where: {
        id: input.logId,
      },
      data: {
        status: input.status,
        resendEmailId: input.resendEmailId,
        errorMessage: input.errorMessage,
        sentAt: input.status === "SENT" ? new Date() : undefined,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("[MAIL_ERROR] Nie udało się zaktualizować logu email.", {
      error,
      logId: input.logId,
      status: input.status,
    });
  }
}

export async function sendEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const recipients = recipientSchema.parse(input.to);
  const metadata = toSerializableMetadata({
    ...input.metadata,
    previewText: input.previewText,
  });
  const idempotencyKey =
    input.idempotencyKey ??
    createIdempotencyKey({
      type: input.type,
      recipients,
      subject: input.subject,
      metadata,
    });

  console.info("[MAIL] Kolejkuję email transakcyjny.", {
    type: input.type,
    recipients,
    subject: input.subject,
    idempotencyKey,
  });

  const logId = await createEmailLog({
    type: input.type,
    recipients,
    subject: input.subject,
    metadata,
  });

  try {
    assertWithinRateLimit(input.type, recipients);
  } catch (error) {
    const errorMessage = asErrorMessage(error);

    await updateEmailLog({
      logId,
      status: "FAILED",
      errorMessage,
      metadata: {
        ...metadata,
        error: errorMessage,
      },
    });

    console.error("[MAIL_ERROR] Email zatrzymany przez rate limiting.", {
      type: input.type,
      recipients,
      error: errorMessage,
    });

    return {
      ok: false,
      error: errorMessage,
      logId,
    };
  }

  let resend: ReturnType<typeof getResendClient>;

  try {
    resend = getResendClient();
  } catch (error) {
    const errorMessage = asErrorMessage(error);

    await updateEmailLog({
      logId,
      status: "FAILED",
      errorMessage,
      metadata: {
        ...metadata,
        error: errorMessage,
      },
    });

    console.error("[MAIL_ERROR] Brak konfiguracji Resend.", {
      type: input.type,
      recipients,
      error: errorMessage,
    });

    return {
      ok: false,
      error: errorMessage,
      logId,
    };
  }

  const payload = {
    from: getResendFromAddress(),
    to: recipients,
    subject: input.subject,
    react: input.react,
    replyTo: input.replyTo,
    tags: [
      {
        name: "type",
        value: input.type.replaceAll(".", "_"),
      },
    ],
  } satisfies CreateEmailOptions;

  let lastError = "Unknown email error.";

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    try {
      const result = await resend.emails.send(payload, {
        idempotencyKey,
      });

      if (result.error) {
        throw result.error;
      }

      const resendEmailId = result.data?.id ?? "";

      await updateEmailLog({
        logId,
        status: "SENT",
        resendEmailId,
        metadata: {
          ...metadata,
          resendResponse: result.data ? { id: result.data.id } : null,
          attempt,
          idempotencyKey,
        },
      });

      console.info("[MAIL_SENT] Email wysłany.", {
        type: input.type,
        recipients,
        resendEmailId,
        logId,
      });

      return {
        ok: true,
        id: resendEmailId,
        logId,
      };
    } catch (error) {
      lastError = asErrorMessage(error);

      if (attempt < MAX_SEND_ATTEMPTS) {
        console.warn("[MAIL_RETRY] Ponawiam wysyłkę email.", {
          type: input.type,
          recipients,
          attempt,
          error: lastError,
        });
        await sleep(300 * attempt);
        continue;
      }
    }
  }

  await updateEmailLog({
    logId,
    status: "FAILED",
    errorMessage: lastError,
    metadata: {
      ...metadata,
      error: lastError,
      idempotencyKey,
      attempts: MAX_SEND_ATTEMPTS,
    },
  });

  console.error("[MAIL_ERROR] Nie udało się wysłać email.", {
    type: input.type,
    recipients,
    error: lastError,
    logId,
  });

  return {
    ok: false,
    error: lastError,
    logId,
  };
}
