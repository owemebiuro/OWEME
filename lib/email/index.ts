import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

type SendEmailResult =
  | {
      ok: true;
      id: string | null;
    }
  | {
      ok: false;
      error: unknown;
    };

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  resendClient ??= new Resend(apiKey);
  return resendClient;
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "OWEME <noreply@oweme.pl>";
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResendClient();

  if (!resend) {
    console.warn("[Email] RESEND_API_KEY nie jest ustawiony. Pomijam wysyłkę.", {
      to,
      subject,
    });
    return {
      ok: false,
      error: new Error("RESEND_API_KEY is missing."),
    };
  }

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("[Email] Resend zwrócił błąd.", result.error);
      return {
        ok: false,
        error: result.error,
      };
    }

    return {
      ok: true,
      id: result.data?.id ?? null,
    };
  } catch (error) {
    console.error("[Email] Nie udało się wysłać wiadomości.", error);
    return {
      ok: false,
      error,
    };
  }
}
