import "server-only";

import { Resend } from "resend";
import { z } from "zod";

const resendEnvSchema = z.object({
  RESEND_API_KEY: z.string().trim().min(1, "RESEND_API_KEY is required.").optional(),
  RESEND_FROM: z.string().trim().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().trim().url().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().trim().optional(),
  VERCEL_URL: z.string().trim().optional(),
});

const globalForResend = globalThis as unknown as {
  resend?: Resend;
};

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("Resend can only be initialized on the server.");
  }
}

function parseEnv(options?: { requireApiKey?: boolean }) {
  assertServerOnly();

  const env = resendEnvSchema.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  });

  if (options?.requireApiKey && !env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required.");
  }

  return env;
}

function normalizeFromAddress(value: string) {
  const markdownMailto = value.match(/^(.*?)\s*\[([^\]]+)\]\(mailto:([^)]+)\)$/);

  if (markdownMailto) {
    const label = markdownMailto[1]?.trim() || "OWEME";
    const email = markdownMailto[2]?.trim() || markdownMailto[3]?.trim();

    return `${label} <${email}>`;
  }

  return value;
}

export function getResendClient() {
  const env = parseEnv({ requireApiKey: true });
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required.");
  }

  if (process.env.NODE_ENV === "production") {
    return globalForResend.resend ?? (globalForResend.resend = new Resend(apiKey));
  }

  return globalForResend.resend ?? (globalForResend.resend = new Resend(apiKey));
}

export function getResendFromAddress() {
  const env = parseEnv();
  const from = env.RESEND_FROM ?? env.RESEND_FROM_EMAIL ?? "OWEME <status@oweme.pl>";

  return normalizeFromAddress(from);
}

export function getAppBaseUrl() {
  const env = parseEnv();

  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
