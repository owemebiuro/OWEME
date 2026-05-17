import "server-only";

import WelcomeEmail from "@/src/emails/welcome-email";
import { getAppBaseUrl } from "@/src/lib/resend";
import { sendEmail } from "@/src/server/mail/send-email";

export type SendWelcomeEmailInput = {
  userId: string;
  email: string;
  name: string;
  role: string;
  panelUrl?: string;
};

export async function sendWelcomeEmail(input: SendWelcomeEmailInput) {
  const panelUrl = input.panelUrl ?? `${getAppBaseUrl()}/login`;
  const previewText = "Twoje konto OWEME CRM zostało utworzone.";

  return sendEmail({
    type: "auth.user.created",
    to: input.email,
    subject: "OWEME CRM: konto zostało utworzone",
    previewText,
    react: (
      <WelcomeEmail
        name={input.name}
        email={input.email}
        role={input.role}
        panelUrl={panelUrl}
        previewText={previewText}
      />
    ),
    metadata: {
      userId: input.userId,
      role: input.role,
    },
  });
}
