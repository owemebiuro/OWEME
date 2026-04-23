import type { ClaimSource } from "@prisma/client";

import { claimSourceLabels } from "@/lib/claims/status-colors";

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #171717;
  line-height: 1.55;
`;

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "brak daty";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "w trakcie wyliczania";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function emailShell(title: string, content: string) {
  return `
    <div style="${baseStyles} background:#f5f5f5; padding:24px;">
      <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden;">
        <div style="padding:24px 28px; border-bottom:1px solid #eeeeee;">
          <p style="margin:0; font-size:13px; font-weight:700; color:#737373;">OWEME</p>
          <h1 style="margin:8px 0 0; font-size:22px; line-height:1.25;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px;">
          ${content}
        </div>
        <div style="padding:18px 28px; background:#fafafa; border-top:1px solid #eeeeee; font-size:12px; color:#737373;">
          OWEME CRM · wiadomość wygenerowana automatycznie
        </div>
      </div>
    </div>
  `;
}

export type ClaimRegisteredEmailInput = {
  clientFirstName: string;
  claimNumber: string;
  flightNumber: string | null;
  flightDate: string | Date | null;
  route: string | null;
  potentialAmount: string | number | null;
};

export function claimRegisteredEmailTemplate(input: ClaimRegisteredEmailInput) {
  const subject = `Twoja sprawa nr ${input.claimNumber} została zarejestrowana — OWEME`;
  const flightDetails = [
    input.flightNumber ? `lot ${input.flightNumber}` : null,
    input.flightDate ? `data ${formatDate(input.flightDate)}` : null,
    input.route,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    subject,
    html: emailShell(
      "Sprawa została zarejestrowana",
      `
        <p style="margin:0 0 16px;">Dzień dobry ${escapeHtml(input.clientFirstName)},</p>
        <p style="margin:0 0 16px;">potwierdzamy przyjęcie sprawy nr <strong>${escapeHtml(input.claimNumber)}</strong>.</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr>
            <td style="padding:10px; border:1px solid #eeeeee; color:#737373;">Lot</td>
            <td style="padding:10px; border:1px solid #eeeeee;"><strong>${escapeHtml(flightDetails || "dane lotu w trakcie uzupełniania")}</strong></td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #eeeeee; color:#737373;">Szacunkowa kwota</td>
            <td style="padding:10px; border:1px solid #eeeeee;"><strong>${escapeHtml(formatAmount(input.potentialAmount))}</strong></td>
          </tr>
        </table>
        <p style="margin:0 0 16px;">Co dalej? Zweryfikujemy kompletność danych, przygotujemy dokumenty i skontaktujemy się, jeśli będzie potrzebne uzupełnienie informacji.</p>
        <p style="margin:0;">Dziękujemy,<br />Zespół OWEME</p>
      `,
    ),
  };
}

export type OverdueTasksEmailInput = {
  operatorName: string;
  tasks: {
    title: string;
    dueDate: string | Date | null;
    claimNumber: string;
    clientName: string;
  }[];
};

export function overdueTasksEmailTemplate(input: OverdueTasksEmailInput) {
  const taskRows = input.tasks
    .map(
      (task) => `
        <li style="margin:0 0 12px;">
          <strong>${escapeHtml(task.title)}</strong><br />
          <span style="color:#737373;">${escapeHtml(task.claimNumber)} · ${escapeHtml(task.clientName)} · termin: ${escapeHtml(formatDate(task.dueDate))}</span>
        </li>
      `,
    )
    .join("");

  return {
    subject: `Masz ${input.tasks.length} zaległych zadań — OWEME CRM`,
    html: emailShell(
      "Zaległe zadania",
      `
        <p style="margin:0 0 16px;">Cześć ${escapeHtml(input.operatorName)},</p>
        <p style="margin:0 0 16px;">masz zaległe zadania wymagające działania:</p>
        <ul style="padding-left:20px; margin:0;">${taskRows}</ul>
      `,
    ),
  };
}

export type UnassignedClaimsEmailInput = {
  claims: {
    claimNumber: string;
    source: ClaimSource;
    createdAt: string | Date;
    clientName: string;
  }[];
};

export function unassignedClaimsEmailTemplate(input: UnassignedClaimsEmailInput) {
  const claimRows = input.claims
    .map(
      (claim) => `
        <li style="margin:0 0 12px;">
          <strong>${escapeHtml(claim.claimNumber)}</strong><br />
          <span style="color:#737373;">${escapeHtml(claim.clientName)} · ${escapeHtml(claimSourceLabels[claim.source])} · utworzono: ${escapeHtml(formatDate(claim.createdAt))}</span>
        </li>
      `,
    )
    .join("");

  return {
    subject: `${input.claims.length} spraw bez opiekuna ponad 48h — OWEME CRM`,
    html: emailShell(
      "Sprawy bez opiekuna",
      `
        <p style="margin:0 0 16px;">Poniższe sprawy pozostają bez opiekuna ponad 48 godzin:</p>
        <ul style="padding-left:20px; margin:0;">${claimRows}</ul>
      `,
    ),
  };
}

export type PasswordResetEmailInput = {
  name: string;
  resetUrl: string;
};

export function passwordResetEmailTemplate(input: PasswordResetEmailInput) {
  return {
    subject: "Reset hasła do OWEME CRM",
    html: emailShell(
      "Reset hasła",
      `
        <p style="margin:0 0 16px;">Cześć ${escapeHtml(input.name)},</p>
        <p style="margin:0 0 16px;">Administrator OWEME CRM uruchomił reset hasła dla Twojego konta.</p>
        <p style="margin:24px 0;">
          <a href="${escapeHtml(input.resetUrl)}" style="display:inline-block; background:#171717; color:#ffffff; text-decoration:none; padding:12px 16px; border-radius:6px; font-weight:700;">Ustaw nowe hasło</a>
        </p>
        <p style="margin:0; color:#737373;">Jeśli nie spodziewasz się tej wiadomości, skontaktuj się z administratorem.</p>
      `,
    ),
  };
}
