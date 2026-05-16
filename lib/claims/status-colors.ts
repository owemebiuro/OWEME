import type { ClaimSource, ClaimStatus, ClaimType } from "@prisma/client";

export const CLAIM_STATUSES = [
  "NEW",
  "AWAITING_VERIFICATION",
  "MISSING_DATA",
  "QUALIFIED",
  "DOCUMENTS_GENERATED",
  "ASSIGNMENT_SIGNED",
  "DEMAND_LETTER_PREPARED",
  "DEMAND_LETTER_SENT",
  "AWAITING_AIRLINE_RESPONSE",
  "NEGATIVE_RESPONSE",
  "COURT_DECISION_PENDING",
  "COURT_STAGE",
  "WON",
  "SETTLEMENT",
  "CLOSED_PAID",
  "REJECTED",
  "DISMISSED",
] as const satisfies readonly ClaimStatus[];

export const CLAIM_TYPES = [
  "DELAY",
  "CANCELLATION",
  "DENIED_BOARDING",
] as const satisfies readonly ClaimType[];

export const CLAIM_SOURCES = [
  "WEBSITE_FORM",
  "CHECKER_FORM",
  "MANUAL",
  "IMPORT",
] as const satisfies readonly ClaimSource[];

export const claimStatusLabels: Record<ClaimStatus, string> = {
  NEW: "Nowa",
  AWAITING_VERIFICATION: "Weryfikacja",
  MISSING_DATA: "Braki formalne",
  QUALIFIED: "Zakwalifikowana",
  DOCUMENTS_GENERATED: "Dokumenty wygenerowane",
  ASSIGNMENT_SIGNED: "Cesja podpisana",
  DEMAND_LETTER_PREPARED: "Wezwanie gotowe",
  DEMAND_LETTER_SENT: "Reklamacja wysłana",
  AWAITING_AIRLINE_RESPONSE: "Negocjacje ugodowe",
  NEGATIVE_RESPONSE: "Odmowa linii",
  COURT_DECISION_PENDING: "Złożona do sądu",
  COURT_STAGE: "Oczekuje na wyrok",
  WON: "Wygrana sądowa",
  SETTLEMENT: "Ugoda",
  CLOSED_PAID: "Wypłacona i zamknięta",
  REJECTED: "Odrzucona",
  DISMISSED: "Przegrana sądowa",
};

export const claimStatusClasses: Record<ClaimStatus, string> = {
  NEW: "border-neutral-200 bg-neutral-100 text-neutral-700",
  AWAITING_VERIFICATION: "border-blue-200 bg-blue-50 text-blue-700",
  MISSING_DATA: "border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] text-[var(--ember-lo)]",
  QUALIFIED: "border-teal-200 bg-teal-50 text-teal-700",
  DOCUMENTS_GENERATED: "border-teal-200 bg-teal-50 text-teal-700",
  ASSIGNMENT_SIGNED: "border-green-200 bg-green-50 text-green-700",
  DEMAND_LETTER_PREPARED: "border-blue-200 bg-blue-50 text-blue-700",
  DEMAND_LETTER_SENT: "border-blue-200 bg-blue-50 text-blue-700",
  AWAITING_AIRLINE_RESPONSE: "border-blue-200 bg-blue-50 text-blue-700",
  NEGATIVE_RESPONSE: "border-red-200 bg-red-50 text-red-700",
  COURT_DECISION_PENDING: "border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] text-[var(--ember-lo)]",
  COURT_STAGE: "border-purple-200 bg-purple-50 text-purple-700",
  WON: "border-green-200 bg-green-50 text-green-700",
  SETTLEMENT: "border-green-200 bg-green-50 text-green-700",
  CLOSED_PAID: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-neutral-200 bg-neutral-50 text-neutral-500",
  DISMISSED: "border-neutral-200 bg-neutral-50 text-neutral-500",
};

export const claimTypeLabels: Record<ClaimType, string> = {
  DELAY: "Opóźnienie",
  CANCELLATION: "Odwołanie",
  DENIED_BOARDING: "Odmowa wejścia",
};

export const claimSourceLabels: Record<ClaimSource, string> = {
  WEBSITE_FORM: "Formularz WWW",
  CHECKER_FORM: "Checker",
  MANUAL: "Ręcznie",
  IMPORT: "Import",
};
