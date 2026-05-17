import "server-only";

import crypto from "node:crypto";
import { createElement } from "react";

import PasswordResetEmail from "@/src/emails/password-reset-email";
import { getAppBaseUrl } from "@/src/lib/resend";
import { sendEmail } from "@/src/server/mail/send-email";

export type SendPasswordResetEmailInput = {
  userId: string;
  email: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const panelUrl = `${getAppBaseUrl()}/login`;
  const previewText = "Link do ustawienia nowego hasła w OWEME CRM.";
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(input.resetUrl)
    .digest("hex")
    .slice(0, 32);

  return sendEmail({
    type: "auth.password.reset",
    to: input.email,
    subject: "OWEME CRM: ustaw nowe hasło",
    previewText,
    react: createElement(PasswordResetEmail, {
      name: input.name,
      resetUrl: input.resetUrl,
      panelUrl,
      previewText,
    }),
    metadata: {
      userId: input.userId,
      resetTokenHash,
    },
    idempotencyKey: `password-reset-${input.userId}-${resetTokenHash}`,
  });
}
