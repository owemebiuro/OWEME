import type { ClaimStatus } from "@prisma/client";

import type { EmailStatusTone } from "@/src/emails/components/email-status-badge";

export type TransactionalEmailType =
  | "claim.created"
  | "claim.status.changed"
  | "claim.documents.requested"
  | "auth.user.created"
  | "auth.password.reset"
  | "crm.overdue_tasks"
  | "crm.unassigned_claims"
  | "system.test";

export type ClaimStatusEmailData = {
  subject: string;
  previewText: string;
  ctaLabel: string;
  oldStatusLabel: string;
  newStatusLabel: string;
  newStatusTone: EmailStatusTone;
  statusDescription: string;
  nextStep: string;
};

type StatusDisplay = {
  label: string;
  tone: EmailStatusTone;
  description: string;
  nextStep: string;
};

export const claimStatusDisplay: Record<ClaimStatus, StatusDisplay> = {
  NEW: {
    label: "Nowa",
    tone: "slate",
    description: "Sprawa została przyjęta do systemu OWEME.",
    nextStep: "Zweryfikujemy podstawowe dane i poinformujemy Cię o wyniku analizy.",
  },
  AWAITING_VERIFICATION: {
    label: "Weryfikacja",
    tone: "blue",
    description: "Analizujemy dane lotu, dokumenty oraz podstawę roszczenia.",
    nextStep: "Nasz zespół sprawdzi kompletność informacji i zakwalifikuje sprawę.",
  },
  MISSING_DATA: {
    label: "Braki formalne",
    tone: "amber",
    description: "Do dalszego prowadzenia sprawy potrzebujemy dodatkowych danych lub dokumentów.",
    nextStep: "Wejdź do panelu klienta i uzupełnij wskazane informacje.",
  },
  QUALIFIED: {
    label: "Zakwalifikowana",
    tone: "green",
    description: "Sprawa spełnia kryteria do dalszego dochodzenia roszczenia.",
    nextStep: "Przygotujemy dokumenty potrzebne do prowadzenia sprawy.",
  },
  DOCUMENTS_GENERATED: {
    label: "Dokumenty wygenerowane",
    tone: "green",
    description: "Dokumenty sprawy są gotowe do podpisu lub dalszej obsługi.",
    nextStep: "Sprawdź panel klienta i wykonaj widoczną tam akcję.",
  },
  ASSIGNMENT_SIGNED: {
    label: "Cesja podpisana",
    tone: "green",
    description: "Otrzymaliśmy podpisane dokumenty cesji wierzytelności.",
    nextStep: "Przygotujemy formalne wezwanie do linii lotniczej.",
  },
  DEMAND_LETTER_PREPARED: {
    label: "Wezwanie gotowe",
    tone: "blue",
    description: "Wezwanie do zapłaty zostało przygotowane.",
    nextStep: "Po kontroli jakości wyślemy je do linii lotniczej.",
  },
  DEMAND_LETTER_SENT: {
    label: "Reklamacja wysłana",
    tone: "blue",
    description: "Roszczenie zostało skierowane do linii lotniczej.",
    nextStep: "Czekamy na stanowisko przewoźnika i będziemy monitorować termin odpowiedzi.",
  },
  AWAITING_AIRLINE_RESPONSE: {
    label: "Oczekujemy na odpowiedź linii",
    tone: "blue",
    description: "Linia lotnicza ma czas na zajęcie stanowiska w sprawie.",
    nextStep: "Poinformujemy Cię, gdy otrzymamy odpowiedź lub upłynie termin.",
  },
  NEGATIVE_RESPONSE: {
    label: "Odmowa linii",
    tone: "red",
    description: "Linia lotnicza odmówiła wypłaty na etapie reklamacyjnym.",
    nextStep: "Przeanalizujemy odpowiedź i ocenimy zasadność dalszych działań.",
  },
  COURT_DECISION_PENDING: {
    label: "Decyzja o etapie sądowym",
    tone: "purple",
    description: "Sprawa jest analizowana pod kątem skierowania na drogę sądową.",
    nextStep: "Jeżeli etap sądowy będzie zasadny, otrzymasz dalsze informacje.",
  },
  COURT_STAGE: {
    label: "Etap sądowy",
    tone: "purple",
    description: "Sprawa jest prowadzona na etapie sądowym.",
    nextStep: "Będziemy monitorować postępowanie i informować o istotnych zmianach.",
  },
  WON: {
    label: "Wygrana",
    tone: "green",
    description: "Sprawa zakończyła się pozytywnym rozstrzygnięciem.",
    nextStep: "Przejdziemy do rozliczenia i wypłaty należnych środków.",
  },
  SETTLEMENT: {
    label: "Ugoda",
    tone: "green",
    description: "W sprawie pojawiła się propozycja lub realizacja ugody.",
    nextStep: "Poinformujemy Cię o szczegółach rozliczenia.",
  },
  CLOSED_PAID: {
    label: "Wypłacona i zamknięta",
    tone: "green",
    description: "Sprawa została rozliczona i zamknięta.",
    nextStep: "Nie musisz wykonywać dodatkowych działań.",
  },
  REJECTED: {
    label: "Odrzucona",
    tone: "slate",
    description: "Sprawa nie będzie dalej prowadzona przez OWEME.",
    nextStep: "W panelu klienta znajdziesz informacje dotyczące decyzji.",
  },
  DISMISSED: {
    label: "Oddalona",
    tone: "slate",
    description: "Postępowanie zakończyło się niekorzystnym rozstrzygnięciem.",
    nextStep: "Jeżeli pojawią się dalsze możliwości, skontaktujemy się z Tobą.",
  },
};

export function getClaimStatusEmailData(input: {
  claimNumber: string;
  oldStatus: ClaimStatus;
  newStatus: ClaimStatus;
}): ClaimStatusEmailData {
  const oldStatusDisplay = claimStatusDisplay[input.oldStatus];
  const newStatusDisplay = claimStatusDisplay[input.newStatus];

  return {
    subject: `OWEME: zmiana statusu sprawy ${input.claimNumber}`,
    previewText: `Nowy status sprawy ${input.claimNumber}: ${newStatusDisplay.label}.`,
    ctaLabel: "Sprawdź sprawę w panelu",
    oldStatusLabel: oldStatusDisplay.label,
    newStatusLabel: newStatusDisplay.label,
    newStatusTone: newStatusDisplay.tone,
    statusDescription: newStatusDisplay.description,
    nextStep: newStatusDisplay.nextStep,
  };
}

export function getClaimCreatedEmailData(input: { claimNumber: string }) {
  return {
    subject: `OWEME: przyjęliśmy sprawę ${input.claimNumber}`,
    previewText: `Twoja sprawa ${input.claimNumber} została przyjęta do systemu OWEME.`,
    ctaLabel: "Przejdź do panelu klienta",
  };
}

export function getDocumentRequestEmailData(input: { claimNumber: string }) {
  return {
    subject: `OWEME: uzupełnij dokumenty do sprawy ${input.claimNumber}`,
    previewText: `Potrzebujemy dodatkowych dokumentów do sprawy ${input.claimNumber}.`,
    ctaLabel: "Uzupełnij dokumenty",
  };
}
