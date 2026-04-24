import type {
  ApiDataSource,
  AttachmentType,
  CommissionModel,
  DocumentStatus,
  DocumentType,
  FlightStatus,
  NoteType,
  SettlementStatus,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";

export const commissionModelLabels: Record<CommissionModel, string> = {
  STANDARD_30: "Standard 30%",
  COURT_40: "Sądowa 40%",
};

export const flightStatusLabels: Record<FlightStatus, string> = {
  SCHEDULED: "Zaplanowany",
  ACTIVE: "Aktywny",
  LANDED: "Wylądował",
  CANCELLED: "Odwołany",
  DIVERTED: "Przekierowany",
  UNKNOWN: "Nieznany",
};

export const apiDataSourceLabels: Record<ApiDataSource, string> = {
  AVIATION_STACK: "AeroAPI",
  AERO_DATA_BOX: "AeroDataBox",
  MANUAL: "Ręcznie",
  CACHE: "Cache",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  ASSIGNMENT_AGREEMENT: "Umowa cesji",
  POWER_OF_ATTORNEY: "Pełnomocnictwo",
  DEMAND_LETTER: "Wezwanie do zapłaty",
  NEGATIVE_RESPONSE_REPLY: "Odpowiedź na odmowę",
  LAWSUIT: "Pozew",
  SETTLEMENT_CONFIRMATION: "Potwierdzenie ugody",
  CLIENT_CONFIRMATION: "Potwierdzenie klienta",
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  DRAFT: "Roboczy",
  GENERATED: "Wygenerowany",
  SIGNED: "Podpisany",
  ARCHIVED: "Zarchiwizowany",
};

export const attachmentTypeLabels: Record<AttachmentType, string> = {
  BOARDING_PASS: "Karta pokładowa",
  BOOKING_CONFIRMATION: "Potwierdzenie rezerwacji",
  ID_DOCUMENT: "Dokument tożsamości",
  CORRESPONDENCE: "Korespondencja",
  COURT_DOCUMENT: "Dokument sądowy",
  OTHER: "Inny",
};

export const noteTypeLabels: Record<NoteType, string> = {
  INTERNAL: "Wewnętrzna",
  OUTGOING_CORRESPONDENCE: "Wychodząca",
  INCOMING_CORRESPONDENCE: "Przychodząca",
  PHONE_CALL: "Telefon",
  ESCALATION: "Eskalacja",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Niski",
  MEDIUM: "Średni",
  HIGH: "Wysoki",
  URGENT: "Pilny",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  OPEN: "Otwarte",
  IN_PROGRESS: "W toku",
  DONE: "Zrobione",
  CANCELLED: "Anulowane",
};

export const settlementStatusLabels: Record<SettlementStatus, string> = {
  PENDING: "Oczekuje",
  RECEIVED: "Otrzymano",
  CLIENT_PAID: "Klient opłacony",
  COMPLETED: "Zakończone",
};

export const taskPriorityClasses: Record<TaskPriority, string> = {
  LOW: "border-neutral-200 bg-neutral-50 text-neutral-600",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-700",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700",
  URGENT: "border-red-200 bg-red-50 text-red-700",
};
