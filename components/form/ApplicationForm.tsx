"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  submitPublicClaimApplication,
  type PublicClaimApplicationInput,
} from "@/app/formularz/actions";
import { compensationAmount } from "@/lib/flight-checker-data";

import styles from "./ApplicationForm.module.css";

type ClaimReason =
  | "DELAY"
  | "CANCELLATION"
  | "DENIED_BOARDING"
  | "REROUTING";
type ClaimTypeValue = "DELAY" | "CANCELLATION" | "DENIED_BOARDING";
type ClaimSourceValue = "WEBSITE_FORM" | "CHECKER_FORM";
type CasePriority = "NORMAL" | "URGENT" | "VIP";
type CompensationAmount = 250 | 400 | 600;

type AdditionalPassengerDraft = {
  fullName: string;
  pesel: string;
  identityDocument: string;
};

type BoardingPassDraft = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
};

type ClientDraft = {
  firstName: string;
  lastName: string;
  isCompany: boolean;
  companyName: string;
  pesel: string;
  nip: string;
  identityDocument: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  iban: string;
};

type ConsentDraft = {
  termsAccepted: boolean;
  assignmentAccepted: boolean;
  rodoAccepted: boolean;
  powerOfAttorneyAccepted: boolean;
  marketingAccepted: boolean;
  offlineAccepted: boolean;
};

type AdminDraft = {
  assignedLawyerId: string;
  priority: CasePriority;
};

type ApplicationState = {
  leadId?: string;
  flightId?: string;
  manual: boolean;
  flightNumber: string;
  flightDate: string;
  reason: ClaimReason;
  departureAirportCode: string;
  arrivalAirportCode: string;
  airlineName: string;
  passengersCount: number;
  delayMinutes: number | null;
  deniedBoardingReason: string;
  boardingPass: BoardingPassDraft | null;
  additionalPhotos: BoardingPassDraft[];
  source: ClaimSourceValue;
  client: ClientDraft;
  additionalPassengers: AdditionalPassengerDraft[];
  consents: ConsentDraft;
  admin: AdminDraft;
};

export type ApplicationFormState = ApplicationState;

export type ApplicationInitialData = {
  leadId?: string;
  flightId?: string;
  manual: boolean;
  flightNumber: string;
  flightDate: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  airlineName?: string;
  reason?: ClaimReason;
  delayMinutes: number | null;
  passengers: number;
  source: ClaimSourceValue;
  client?: Partial<
    Pick<ClientDraft, "firstName" | "lastName" | "email" | "phone">
  >;
};

export type AdminUserOption = {
  id: string;
  name: string;
};

export interface ClaimPayload {
  [key: string]: unknown;
  NUMER_UMOWY_CESJI: string;
  NUMER_PELNOMOCNICTWA: string;
  DATA_ZAWARCIA: string;
  DATA_UDZIELENIA: string;
  DATA_UMOWY_CESJI: string;
  WERSJA_DOKUMENTU: string;
  NR_LOTU: string;
  DATA_LOTU: string;
  PORT_ODLOTU_IATA: string;
  PORT_PRZYLOTU_IATA: string;
  NAZWA_LINII_LOTNICZEJ: string;
  POWOD_WNIOSKU: string;
  OPOZNIENIE_MINUTY?: number;
  SZACOWANA_KWOTA_EUR: CompensationAmount;
  IMIE_NAZWISKO_KLIENTA: string;
  PESEL_NIP_KLIENTA: string;
  ADRES_KLIENTA: string;
  NR_DOK_TOZSAMOSCI: string;
  EMAIL_KLIENTA: string;
  TELEFON_KLIENTA: string;
  NUMER_KONTA_BANKOWEGO: string;
  KARTA_POKLADOWA?: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  };
  ZDJECIA_DODATKOWE?: Array<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  }>;
  DODATKOWI_PASAZEROWIE: Array<{
    IMIE_NAZWISKO: string;
    PESEL: string;
    NR_DOK_TOZSAMOSCI: string;
  }>;
  LICZBA_PASAZEROW: number;
  zgoda_regulamin: boolean;
  zgoda_cesja: boolean;
  zgoda_rodo: boolean;
  zgoda_pelnomocnictwo: boolean;
  zgoda_marketing: boolean;
}

type FieldErrors = Partial<Record<string, string>>;
type ConsentDocumentKey =
  | "terms"
  | "assignment"
  | "rodo"
  | "powerOfAttorney";

const steps = ["Lot", "Kontakt", "Pasażerowie", "Zgody"] as const;
const flightNumberPattern = /^[A-Z]{1,3}[0-9]{1,4}$/;
const airportCodePattern = /^[A-Z]{3}$/;
const postalCodePattern = /^\d{2}-\d{3}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BACKEND_GENERATED = "GENEROWANE_PRZEZ_BACKEND";

const reasonLabels: Record<ClaimReason, string> = {
  DELAY: "Opóźnienie lotu (≥3h)",
  CANCELLATION: "Odwołanie lotu",
  DENIED_BOARDING: "Odmowa wejścia na pokład (overbooking)",
  REROUTING: "Zmiana trasy / przekierowanie",
};

const payloadReasonLabels: Record<ClaimReason, string> = {
  DELAY: "Opóźnienie",
  CANCELLATION: "Odwołanie",
  DENIED_BOARDING: "Overbooking",
  REROUTING: "Zmiana trasy",
};

const consentDocuments: Record<
  ConsentDocumentKey,
  { title: string; body: string }
> = {
  terms: {
    title: "Regulamin i Polityka Prywatności oweme",
    body:
      "Dokument określa zasady obsługi wniosku, kontaktu z klientem oraz podstawowe informacje o ochronie prywatności w procesie dochodzenia roszczeń.",
  },
  assignment: {
    title: "Umowa Cesji Wierzytelności",
    body:
      "Cesja pozwala oweme dochodzić roszczenia od przewoźnika w Twoim imieniu i rozliczyć sprawę po skutecznym odzyskaniu środków.",
  },
  rodo: {
    title: "Klauzula RODO",
    body:
      "Klauzula opisuje administratora danych, cele przetwarzania, podstawy prawne oraz prawa osoby, której dane dotyczą.",
  },
  powerOfAttorney: {
    title: "Pełnomocnictwo",
    body:
      "Pełnomocnictwo umożliwia oweme reprezentowanie klienta wobec przewoźnika, organów i sądów w zakresie niezbędnym do obsługi sprawy.",
  },
};

function clampPassengers(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(9, Math.max(1, Math.round(value)));
}

function createPassengerSlots(
  count: number,
  current: AdditionalPassengerDraft[] = [],
) {
  return Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({
    fullName: current[index]?.fullName ?? "",
    pesel: current[index]?.pesel ?? "",
    identityDocument: current[index]?.identityDocument ?? "",
  }));
}

function normalizeFlightNumber(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeAirportCode(value: string) {
  return value.trim().toUpperCase().slice(0, 3);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPostalCode(value: string) {
  const digits = onlyDigits(value).slice(0, 5);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

function getPolishPhoneNationalDigits(value: string) {
  const digits = onlyDigits(value);
  const nationalDigits = digits.startsWith("48") ? digits.slice(2) : digits;

  return nationalDigits.slice(0, 9);
}

function formatPhoneNumber(value: string) {
  const nationalDigits = getPolishPhoneNationalDigits(value);

  if (!nationalDigits) {
    return "";
  }

  const groups = nationalDigits.match(/.{1,3}/g) ?? [];

  return `+ 48 ${groups.join(" ")}`;
}

function normalizePhoneNumber(value: string) {
  const nationalDigits = getPolishPhoneNationalDigits(value);

  return nationalDigits ? `48${nationalDigits}` : "";
}

function getPolishIbanDigits(value: string) {
  const withoutPrefix = value.toUpperCase().replace(/^PL\s*/, "");

  return onlyDigits(withoutPrefix).slice(0, 26);
}

function formatPolishIban(value: string) {
  const digits = getPolishIbanDigits(value);

  if (!digits) {
    return "";
  }

  const groups = [digits.slice(0, 2)];
  for (let index = 2; index < digits.length; index += 4) {
    groups.push(digits.slice(index, index + 4));
  }

  return `PL ${groups.filter(Boolean).join(" ")}`;
}

function normalizeIban(value: string) {
  const digits = getPolishIbanDigits(value);

  return digits ? `PL${digits}` : "";
}

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ") || parts[0] || "",
  };
}

function isFlightDateInAllowedRange(value: string) {
  if (!value) {
    return false;
  }

  const flightDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(flightDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 3);

  return flightDate <= today && flightDate >= minDate;
}

function isValidPesel(value: string) {
  const digits = onlyDigits(value);

  if (!/^\d{11}$/.test(digits)) {
    return false;
  }

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = weights.reduce(
    (total, weight, index) => total + weight * Number(digits[index]),
    0,
  );
  const checksum = (10 - (sum % 10)) % 10;

  return checksum === Number(digits[10]);
}

function isValidNip(value: string) {
  const digits = onlyDigits(value);

  if (!digits) {
    return true;
  }

  if (!/^\d{10}$/.test(digits)) {
    return false;
  }

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum =
    weights.reduce(
      (total, weight, index) => total + weight * Number(digits[index]),
      0,
    ) % 11;

  return checksum !== 10 && checksum === Number(digits[9]);
}

function isValidPolishIban(value: string) {
  const iban = normalizeIban(value);

  if (!/^PL\d{26}$/.test(iban)) {
    return false;
  }

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = Array.from(rearranged)
    .map((char) => {
      if (/[A-Z]/.test(char)) {
        return String(char.charCodeAt(0) - 55);
      }

      return char;
    })
    .join("");

  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1;
}

function estimateCompensation(state: ApplicationState) {
  if (
    !airportCodePattern.test(state.departureAirportCode) ||
    !airportCodePattern.test(state.arrivalAirportCode)
  ) {
    return null;
  }

  return compensationAmount(
    state.departureAirportCode,
    state.arrivalAirportCode,
  ) as CompensationAmount;
}

function reasonToClaimType(reason: ClaimReason): ClaimTypeValue {
  if (reason === "DENIED_BOARDING") {
    return "DENIED_BOARDING";
  }

  if (reason === "DELAY") {
    return "DELAY";
  }

  return "CANCELLATION";
}

function buildInitialState(initialData: ApplicationInitialData): ApplicationState {
  const passengersCount = clampPassengers(initialData.passengers);

  return {
    leadId: initialData.leadId,
    flightId: initialData.flightId,
    manual: initialData.manual,
    flightNumber: normalizeFlightNumber(initialData.flightNumber),
    flightDate: initialData.flightDate,
    departureAirportCode: normalizeAirportCode(initialData.departureAirportCode),
    arrivalAirportCode: normalizeAirportCode(initialData.arrivalAirportCode),
    airlineName: initialData.airlineName ?? "",
    reason: initialData.reason ?? "DELAY",
    passengersCount,
    delayMinutes: initialData.delayMinutes,
    deniedBoardingReason: "",
    boardingPass: null,
    additionalPhotos: [],
    source: initialData.source,
    client: {
      firstName: initialData.client?.firstName ?? "",
      lastName: initialData.client?.lastName ?? "",
      isCompany: false,
      companyName: "",
      pesel: "",
      nip: "",
      identityDocument: "",
      email: initialData.client?.email ?? "",
      phone: formatPhoneNumber(initialData.client?.phone ?? ""),
      address: "",
      postalCode: "",
      city: "",
      country: "PL",
      iban: "",
    },
    additionalPassengers: createPassengerSlots(passengersCount),
    consents: {
      termsAccepted: false,
      assignmentAccepted: false,
      rodoAccepted: false,
      powerOfAttorneyAccepted: false,
      marketingAccepted: false,
      offlineAccepted: false,
    },
    admin: {
      assignedLawyerId: "",
      priority: "NORMAL",
    },
  };
}

function fullAddress(client: ClientDraft) {
  return `${client.address.trim()}, ${client.postalCode.trim()} ${client.city.trim()}, ${client.country.trim()}`;
}

export function buildClaimPayload(formState: ApplicationFormState): ClaimPayload {
  const today = new Date().toISOString().slice(0, 10);
  const amount = estimateCompensation(formState) ?? 250;
  const client = formState.client;

  return {
    NUMER_UMOWY_CESJI: BACKEND_GENERATED,
    NUMER_PELNOMOCNICTWA: BACKEND_GENERATED,
    DATA_ZAWARCIA: today,
    DATA_UDZIELENIA: today,
    DATA_UMOWY_CESJI: today,
    WERSJA_DOKUMENTU: "1.0",
    NR_LOTU: normalizeFlightNumber(formState.flightNumber),
    DATA_LOTU: formState.flightDate,
    PORT_ODLOTU_IATA: normalizeAirportCode(formState.departureAirportCode),
    PORT_PRZYLOTU_IATA: normalizeAirportCode(formState.arrivalAirportCode),
    NAZWA_LINII_LOTNICZEJ: formState.airlineName.trim(),
    POWOD_WNIOSKU: payloadReasonLabels[formState.reason],
    ...(formState.reason === "DELAY" && formState.delayMinutes !== null
      ? { OPOZNIENIE_MINUTY: formState.delayMinutes }
      : {}),
    SZACOWANA_KWOTA_EUR: amount,
    IMIE_NAZWISKO_KLIENTA: `${client.firstName.trim()} ${client.lastName.trim()}`,
    PESEL_NIP_KLIENTA: client.isCompany
      ? onlyDigits(client.nip)
      : onlyDigits(client.pesel),
    ADRES_KLIENTA: fullAddress(client),
    NR_DOK_TOZSAMOSCI: client.identityDocument.trim(),
    EMAIL_KLIENTA: client.email.trim().toLowerCase(),
    TELEFON_KLIENTA: formatPhoneNumber(client.phone),
    NUMER_KONTA_BANKOWEGO: formatPolishIban(client.iban),
    ...(formState.boardingPass
      ? {
          KARTA_POKLADOWA: {
            fileName: formState.boardingPass.fileName,
            mimeType: formState.boardingPass.mimeType,
            sizeBytes: formState.boardingPass.sizeBytes,
            dataUrl: formState.boardingPass.dataUrl,
          },
        }
      : {}),
    ...(formState.additionalPhotos.length
      ? {
          ZDJECIA_DODATKOWE: formState.additionalPhotos.map((photo) => ({
            fileName: photo.fileName,
            mimeType: photo.mimeType,
            sizeBytes: photo.sizeBytes,
            dataUrl: photo.dataUrl,
          })),
        }
      : {}),
    DODATKOWI_PASAZEROWIE: formState.additionalPassengers.map((passenger) => ({
      IMIE_NAZWISKO: passenger.fullName.trim(),
      PESEL: onlyDigits(passenger.pesel),
      NR_DOK_TOZSAMOSCI: passenger.identityDocument.trim(),
    })),
    LICZBA_PASAZEROW: formState.passengersCount,
    zgoda_regulamin: formState.consents.termsAccepted,
    zgoda_cesja: formState.consents.assignmentAccepted,
    zgoda_rodo: formState.consents.rodoAccepted,
    zgoda_pelnomocnictwo: formState.consents.powerOfAttorneyAccepted,
    zgoda_marketing: formState.consents.marketingAccepted,
  };
}

function validateStep(
  step: number,
  state: ApplicationState,
  isAdmin: boolean,
): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) {
    if (!flightNumberPattern.test(state.flightNumber)) {
      errors.flightNumber = "Format: LO123 lub FR1234.";
    }

    if (!isFlightDateInAllowedRange(state.flightDate)) {
      errors.flightDate = "Data lotu nie może być przyszła ani starsza niż 3 lata.";
    }

    if (!state.reason) {
      errors.reason = "Wybierz powód wniosku.";
    }

    if (!airportCodePattern.test(state.departureAirportCode)) {
      errors.departureAirportCode = "Podaj 3-litrowy kod IATA.";
    }

    if (!airportCodePattern.test(state.arrivalAirportCode)) {
      errors.arrivalAirportCode = "Podaj 3-litrowy kod IATA.";
    }

    if (!state.airlineName.trim()) {
      errors.airlineName = "Podaj nazwę linii lotniczej.";
    }

    if (state.passengersCount < 1 || state.passengersCount > 9) {
      errors.passengersCount = "Liczba pasażerów musi być od 1 do 9.";
    }

    if (state.reason === "DELAY") {
      if (state.delayMinutes === null) {
        errors.delayMinutes = "Podaj opóźnienie w minutach.";
      } else if (state.delayMinutes < 180) {
        errors.delayMinutes = "Opóźnienie poniżej 180 minut nie kwalifikuje sprawy.";
      }
    }

    if (
      state.reason === "DENIED_BOARDING" &&
      !state.deniedBoardingReason.trim()
    ) {
      errors.deniedBoardingReason = "Opisz powód odmowy wejścia na pokład.";
    }
  }

  if (step === 2) {
    const client = state.client;

    if (!client.firstName.trim()) errors.firstName = "Podaj imię.";
    if (!client.lastName.trim()) errors.lastName = "Podaj nazwisko.";

    if (client.isCompany) {
      if (!client.companyName.trim()) {
        errors.companyName = "Podaj nazwę firmy.";
      }

      if (!isValidNip(client.nip)) {
        errors.nip = "Podaj poprawny NIP albo zostaw pole puste.";
      }
    } else if (!isValidPesel(client.pesel)) {
      errors.pesel = "Podaj poprawny PESEL.";
    }

    if (!client.identityDocument.trim()) {
      errors.identityDocument = "Podaj serię i numer dokumentu.";
    }

    if (!emailPattern.test(client.email.trim())) {
      errors.email = "Podaj poprawny email.";
    }

    if (!/^48\d{9}$/.test(normalizePhoneNumber(client.phone))) {
      errors.phone = "Podaj numer w formacie + 48 123 123 123.";
    }

    if (!client.address.trim()) errors.address = "Podaj ulicę i numer.";
    if (!postalCodePattern.test(client.postalCode.trim())) {
      errors.postalCode = "Format kodu: 00-000.";
    }
    if (!client.city.trim()) errors.city = "Podaj miasto.";
    if (!client.country.trim()) errors.country = "Podaj kraj.";
    if (!isValidPolishIban(client.iban)) {
      errors.iban = "Podaj poprawny IBAN: PL + 26 cyfr.";
    }
  }

  if (step === 3) {
    state.additionalPassengers.forEach((passenger, index) => {
      if (!passenger.fullName.trim()) {
        errors[`passenger-${index}-fullName`] = "Podaj imię i nazwisko.";
      }

      if (!isValidPesel(passenger.pesel)) {
        errors[`passenger-${index}-pesel`] = "Podaj poprawny PESEL.";
      }

      if (!passenger.identityDocument.trim()) {
        errors[`passenger-${index}-identityDocument`] =
          "Podaj serię i numer dokumentu.";
      }
    });
  }

  if (step === 4) {
    if (isAdmin) {
      if (!state.consents.offlineAccepted) {
        errors.offlineAccepted = "Potwierdź zgody udzielone offline.";
      }
    } else {
      if (!state.consents.termsAccepted) {
        errors.termsAccepted = "Akceptacja regulaminu jest wymagana.";
      }
      if (!state.consents.assignmentAccepted) {
        errors.assignmentAccepted = "Zgoda na cesję jest wymagana.";
      }
      if (!state.consents.rodoAccepted) {
        errors.rodoAccepted = "Zgoda RODO jest wymagana.";
      }
      if (!state.consents.powerOfAttorneyAccepted) {
        errors.powerOfAttorneyAccepted = "Pełnomocnictwo jest wymagane.";
      }
    }
  }

  return errors;
}

function stepFieldKeys(step: number, state: ApplicationState, isAdmin: boolean) {
  if (step === 1) {
    return [
      "flightNumber",
      "flightDate",
      "reason",
      "departureAirportCode",
      "arrivalAirportCode",
      "airlineName",
      "passengersCount",
      "delayMinutes",
      "deniedBoardingReason",
    ];
  }

  if (step === 2) {
    return [
      "firstName",
      "lastName",
      "companyName",
      "pesel",
      "nip",
      "identityDocument",
      "email",
      "phone",
      "address",
      "postalCode",
      "city",
      "country",
      "iban",
    ];
  }

  if (step === 3) {
    return state.additionalPassengers.flatMap((_, index) => [
      `passenger-${index}-fullName`,
      `passenger-${index}-pesel`,
      `passenger-${index}-identityDocument`,
    ]);
  }

  return isAdmin
    ? ["offlineAccepted"]
    : [
        "termsAccepted",
        "assignmentAccepted",
        "rodoAccepted",
        "powerOfAttorneyAccepted",
      ];
}

function FieldError({
  field,
  errors,
  touched,
}: {
  field: string;
  errors: FieldErrors;
  touched: Record<string, boolean>;
}) {
  if (!touched[field] || !errors[field]) {
    return null;
  }

  return <p className={styles.fieldError}>{errors[field]}</p>;
}

function Spinner() {
  return <span className={styles.spinner} aria-hidden="true" />;
}

export function ApplicationForm({
  initialData,
  isAdmin = false,
  adminUsers = [],
}: {
  initialData: ApplicationInitialData;
  isAdmin?: boolean;
  adminUsers?: AdminUserOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ApplicationState>(() =>
    buildInitialState(initialData),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDocument, setOpenDocument] = useState<ConsentDocumentKey | null>(
    null,
  );
  const currentErrors = useMemo(
    () => validateStep(step, form, isAdmin),
    [form, isAdmin, step],
  );
  const hasCurrentStepErrors = Object.keys(currentErrors).length > 0;
  const estimatedAmount = estimateCompensation(form);
  const progress = (step / 4) * 100;

  function markTouched(field: string) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function markStepTouched() {
    const fields = stepFieldKeys(step, form, isAdmin);
    setTouched((current) => ({
      ...current,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    }));
  }

  function goNext() {
    markStepTouched();
    setSubmitError(null);

    if (!hasCurrentStepErrors) {
      setStep((current) => Math.min(4, current + 1));
    }
  }

  function goBack() {
    setSubmitError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  function resetForm() {
    setStep(1);
    setForm(buildInitialState(initialData));
    setTouched({});
    setSubmitError(null);
    setSuccessNumber(null);
  }

  function updateClient<K extends keyof ClientDraft>(
    field: K,
    value: ClientDraft[K],
  ) {
    setForm((current) => ({
      ...current,
      client: {
        ...current.client,
        [field]: value,
      },
    }));
  }

  async function updateApplicationFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);

    if (!files.length) {
      setSubmitError(null);
      setForm((current) => ({
        ...current,
        boardingPass: null,
        additionalPhotos: [],
      }));
      return;
    }

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setSubmitError("Dodaj zdjęcia w formacie obrazu.");
      return;
    }

    if (files.some((file) => file.size > 8 * 1024 * 1024)) {
      setSubmitError("Każde zdjęcie może mieć maksymalnie 8 MB.");
      return;
    }

    try {
      const applicationFiles = await Promise.all(
        files.map(
          (file) =>
            new Promise<BoardingPassDraft>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result !== "string") {
                  reject(new Error("Nie udało się odczytać zdjęcia."));
                  return;
                }

                resolve({
                  fileName: file.name,
                  mimeType: file.type,
                  sizeBytes: file.size,
                  dataUrl: reader.result,
                });
              };
              reader.onerror = () =>
                reject(new Error("Nie udało się odczytać zdjęcia."));
              reader.readAsDataURL(file);
            }),
        ),
      );
      const [boardingPass, ...additionalPhotos] = applicationFiles;

      setSubmitError(null);
      setForm((current) => ({
        ...current,
        boardingPass: boardingPass ?? null,
        additionalPhotos,
      }));
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Nie udało się odczytać zdjęć.",
      );
    }
  }

  function updateConsent<K extends keyof ConsentDraft>(
    field: K,
    value: ConsentDraft[K],
  ) {
    setForm((current) => ({
      ...current,
      consents: {
        ...current.consents,
        [field]: value,
      },
    }));
  }

  function updateAdditionalPassenger(
    index: number,
    field: keyof AdditionalPassengerDraft,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      additionalPassengers: current.additionalPassengers.map((passenger, item) =>
        item === index ? { ...passenger, [field]: value } : passenger,
      ),
    }));
  }

  function addPassenger() {
    setForm((current) => {
      const passengersCount = clampPassengers(current.passengersCount + 1);

      return {
        ...current,
        passengersCount,
        additionalPassengers: createPassengerSlots(
          passengersCount,
          current.additionalPassengers,
        ),
      };
    });
  }

  function removePassenger(index: number) {
    setForm((current) => {
      const nextPassengers = current.additionalPassengers.filter(
        (_, item) => item !== index,
      );

      return {
        ...current,
        passengersCount: nextPassengers.length + 1,
        additionalPassengers: nextPassengers,
      };
    });
  }

  async function handleSubmit() {
    markStepTouched();
    setSubmitError(null);

    const finalErrors = validateStep(4, form, isAdmin);
    if (Object.keys(finalErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const claimPayload = buildClaimPayload(form);
    const legacyPayload: PublicClaimApplicationInput = {
      leadId: form.leadId,
      flightId: form.flightId,
      manual: form.manual,
      flightNumber: claimPayload.NR_LOTU,
      flightDate: form.flightDate,
      departureAirportCode: claimPayload.PORT_ODLOTU_IATA,
      arrivalAirportCode: claimPayload.PORT_PRZYLOTU_IATA,
      delayMinutes: form.delayMinutes,
      source: form.source,
      type: reasonToClaimType(form.reason),
      passengersCount: form.passengersCount,
      primaryPassenger: {
        firstName: form.client.firstName,
        lastName: form.client.lastName,
        pesel: form.client.isCompany ? undefined : onlyDigits(form.client.pesel),
        email: form.client.email,
        phone: formatPhoneNumber(form.client.phone),
        address: form.client.address,
        postalCode: form.client.postalCode,
        city: form.client.city,
        country: form.client.country,
      },
      additionalPassengers: form.additionalPassengers.map((passenger) => {
        const name = splitFullName(passenger.fullName);

        return {
          firstName: name.firstName,
          lastName: name.lastName,
        };
      }),
      consents: {
        termsAccepted: isAdmin ? form.consents.offlineAccepted : form.consents.termsAccepted,
        assignmentAccepted: isAdmin
          ? form.consents.offlineAccepted
          : form.consents.assignmentAccepted,
        marketingAccepted: form.consents.marketingAccepted,
      },
    };
    const payload = {
      ...legacyPayload,
      claimPayload,
      admin: isAdmin
        ? {
            assignedLawyerId: form.admin.assignedLawyerId || null,
            priority: form.admin.priority,
          }
        : null,
    };
    const result = await submitPublicClaimApplication(payload);

    setIsSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    setSuccessNumber(result.claimNumber);
  }

  if (successNumber) {
    return (
      <section className={styles.shell}>
        <aside className={styles.intro}>
          <p className={styles.eyebrow}>Wniosek przyjęty</p>
          <h1>{isAdmin ? "Sprawa utworzona" : "Wniosek złożony"}</h1>
          <p>
            Dane zostały przekazane do obsługi. Kolejny krok to weryfikacja
            dokumentów i kontakt z przewoźnikiem.
          </p>
          <div className={styles.benefits}>
            <span>0% z góry</span>
            <span>Success fee</span>
            <span>Obsługa dokumentów</span>
          </div>
        </aside>

        <div className={styles.card}>
          <div className={styles.successBox}>
            <p className={styles.successEyebrow}>Gotowe</p>
            <h2>Wniosek złożony!</h2>
            <p>
              Numer sprawy: <strong>{successNumber}</strong>
            </p>
            <p>
              Wyślemy potwierdzenie i rozpoczniemy analizę roszczenia. Jeśli
              potrzebne będą dodatkowe dokumenty, skontaktujemy się mailowo lub
              telefonicznie.
            </p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                resetForm();
                router.push("/sprawdz");
              }}
            >
              Sprawdź inny lot
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.shell}>
      <aside className={styles.intro}>
        <p className={styles.eyebrow}>Krok {step} z 4</p>
        <h1>Złóż wniosek o odszkodowanie</h1>
        <p>
          Uzupełnij dane lotu, pasażera i zgody. Analiza jest bezpłatna, a
          oweme pobiera wynagrodzenie dopiero po skutecznym odzyskaniu środków.
        </p>
        <div className={styles.benefits}>
          <span>0% z góry</span>
          <span>Success fee</span>
          <span>Obsługa dokumentów</span>
        </div>
      </aside>

      <div className={styles.card}>
        {isAdmin ? (
          <div className={styles.adminStrip}>
            <label className={styles.field}>
              <span>Przypisany prawnik</span>
              <select
                value={form.admin.assignedLawyerId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    admin: {
                      ...current.admin,
                      assignedLawyerId: event.target.value,
                    },
                  }))
                }
              >
                <option value="">Nie przypisano</option>
                {adminUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Priorytet sprawy</span>
              <select
                value={form.admin.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    admin: {
                      ...current.admin,
                      priority: event.target.value as CasePriority,
                    },
                  }))
                }
              >
                <option value="NORMAL">Normalny</option>
                <option value="URGENT">Pilny</option>
                <option value="VIP">VIP</option>
              </select>
            </label>
          </div>
        ) : null}

        <div className={styles.progress}>
          <span>Krok {step}/4</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <nav className={styles.stepTabs} aria-label="Postęp formularza">
          {steps.map((label, index) => {
            const itemStep = index + 1;
            const className =
              itemStep === step
                ? styles.stepActive
                : itemStep < step
                  ? styles.stepDone
                  : styles.stepIdle;

            return (
              <button
                key={label}
                type="button"
                className={className}
                onClick={() => {
                  if (itemStep <= step) {
                    setStep(itemStep);
                  }
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {step === 1 ? (
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Numer lotu</span>
              <input
                value={form.flightNumber}
                onBlur={() => markTouched("flightNumber")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    flightNumber: normalizeFlightNumber(event.target.value),
                    flightId: undefined,
                    manual: true,
                  }))
                }
                placeholder="FR1234"
              />
              <FieldError
                field="flightNumber"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Data lotu</span>
              <input
                type="date"
                value={form.flightDate}
                onBlur={() => markTouched("flightDate")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    flightDate: event.target.value,
                    flightId: undefined,
                    manual: true,
                  }))
                }
              />
              <FieldError
                field="flightDate"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={`${styles.field} ${styles.wide}`}>
              <span>Powód wniosku</span>
              <select
                value={form.reason}
                onBlur={() => markTouched("reason")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reason: event.target.value as ClaimReason,
                  }))
                }
              >
                {Object.entries(reasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FieldError field="reason" errors={currentErrors} touched={touched} />
            </label>

            <label className={styles.field}>
              <span>Lotnisko wylotu</span>
              <input
                value={form.departureAirportCode}
                onBlur={() => markTouched("departureAirportCode")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departureAirportCode: normalizeAirportCode(event.target.value),
                    flightId: undefined,
                    manual: true,
                  }))
                }
                placeholder="WAW"
                maxLength={3}
              />
              <FieldError
                field="departureAirportCode"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Lotnisko przylotu</span>
              <input
                value={form.arrivalAirportCode}
                onBlur={() => markTouched("arrivalAirportCode")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    arrivalAirportCode: normalizeAirportCode(event.target.value),
                    flightId: undefined,
                    manual: true,
                  }))
                }
                placeholder="LHR"
                maxLength={3}
              />
              <FieldError
                field="arrivalAirportCode"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Nazwa linii lotniczej</span>
              <input
                value={form.airlineName}
                onBlur={() => markTouched("airlineName")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    airlineName: event.target.value,
                  }))
                }
                placeholder="Ryanair"
              />
              <FieldError
                field="airlineName"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Liczba pasażerów</span>
              <input
                type="number"
                min={1}
                max={9}
                value={form.passengersCount}
                onBlur={() => markTouched("passengersCount")}
                onChange={(event) => {
                  const passengersCount = clampPassengers(
                    Number(event.target.value),
                  );
                  setForm((current) => ({
                    ...current,
                    passengersCount,
                    additionalPassengers: createPassengerSlots(
                      passengersCount,
                      current.additionalPassengers,
                    ),
                  }));
                }}
              />
              <FieldError
                field="passengersCount"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            {form.reason === "DELAY" ? (
              <label className={styles.field}>
                <span>Opóźnienie w minutach</span>
                <input
                  type="number"
                  min={180}
                  value={form.delayMinutes ?? ""}
                  onBlur={() => markTouched("delayMinutes")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      delayMinutes: event.target.value
                        ? Math.max(0, Math.round(Number(event.target.value)))
                        : null,
                    }))
                  }
                  placeholder="180"
                />
                <FieldError
                  field="delayMinutes"
                  errors={currentErrors}
                  touched={touched}
                />
              </label>
            ) : null}

            {form.reason === "DENIED_BOARDING" ? (
              <label className={`${styles.field} ${styles.wide}`}>
                <span>Powód odmowy</span>
                <input
                  value={form.deniedBoardingReason}
                  onBlur={() => markTouched("deniedBoardingReason")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deniedBoardingReason: event.target.value,
                    }))
                  }
                  placeholder="Np. overbooking"
                />
                <FieldError
                  field="deniedBoardingReason"
                  errors={currentErrors}
                  touched={touched}
                />
              </label>
            ) : null}

            <label className={`${styles.field} ${styles.wide}`}>
              <span>Zdjęcie karty pokładowej</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  void updateApplicationFiles(event.target.files)
                }
              />
              <p className={styles.fieldHint}>
                Opcjonalnie dodaj zdjęcie karty pokładowej albo inne zdjęcia,
                które pomogą zweryfikować wniosek.
              </p>
              {form.boardingPass || form.additionalPhotos.length ? (
                <p className={styles.filePreview}>
                  Dodano:{" "}
                  {[form.boardingPass, ...form.additionalPhotos]
                    .filter(Boolean)
                    .map((file) => file?.fileName)
                    .join(", ")}
                </p>
              ) : null}
            </label>

            {estimatedAmount ? (
              <div className={styles.amountBadge}>
                Szacowana kwota: <strong>{estimatedAmount} EUR</strong>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.grid}>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={form.client.isCompany}
                onChange={(event) =>
                  updateClient("isCompany", event.target.checked)
                }
              />
              <span>Reprezentuję firmę</span>
            </label>

            {form.client.isCompany ? (
              <label className={`${styles.field} ${styles.wide}`}>
                <span>Nazwa firmy</span>
                <input
                  value={form.client.companyName}
                  onBlur={() => markTouched("companyName")}
                  onChange={(event) =>
                    updateClient("companyName", event.target.value)
                  }
                />
                <FieldError
                  field="companyName"
                  errors={currentErrors}
                  touched={touched}
                />
              </label>
            ) : null}

            <label className={styles.field}>
              <span>Imię</span>
              <input
                value={form.client.firstName}
                autoComplete="given-name"
                onBlur={() => markTouched("firstName")}
                onChange={(event) =>
                  updateClient("firstName", event.target.value)
                }
              />
              <FieldError
                field="firstName"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Nazwisko</span>
              <input
                value={form.client.lastName}
                autoComplete="family-name"
                onBlur={() => markTouched("lastName")}
                onChange={(event) =>
                  updateClient("lastName", event.target.value)
                }
              />
              <FieldError
                field="lastName"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            {form.client.isCompany ? (
              <label className={styles.field}>
                <span>NIP</span>
                <input
                  value={form.client.nip}
                  onBlur={() => markTouched("nip")}
                  onChange={(event) => updateClient("nip", event.target.value)}
                  inputMode="numeric"
                />
                <FieldError field="nip" errors={currentErrors} touched={touched} />
              </label>
            ) : (
              <label className={styles.field}>
                <span>PESEL</span>
                <input
                  value={form.client.pesel}
                  onBlur={() => markTouched("pesel")}
                  onChange={(event) =>
                    updateClient("pesel", onlyDigits(event.target.value).slice(0, 11))
                  }
                  inputMode="numeric"
                />
                <FieldError
                  field="pesel"
                  errors={currentErrors}
                  touched={touched}
                />
              </label>
            )}

            <label className={styles.field}>
              <span>Seria i nr dokumentu</span>
              <input
                value={form.client.identityDocument}
                onBlur={() => markTouched("identityDocument")}
                onChange={(event) =>
                  updateClient("identityDocument", event.target.value)
                }
              />
              <FieldError
                field="identityDocument"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                value={form.client.email}
                autoComplete="email"
                onBlur={() => markTouched("email")}
                onChange={(event) => updateClient("email", event.target.value)}
              />
              <FieldError
                field="email"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Telefon</span>
              <input
                value={form.client.phone}
                autoComplete="tel"
                inputMode="tel"
                maxLength={16}
                placeholder="+ 48 123 123 123"
                onBlur={() => markTouched("phone")}
                onChange={(event) =>
                  updateClient("phone", formatPhoneNumber(event.target.value))
                }
              />
              <FieldError
                field="phone"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={`${styles.field} ${styles.wide}`}>
              <span>Adres</span>
              <input
                value={form.client.address}
                autoComplete="street-address"
                onBlur={() => markTouched("address")}
                onChange={(event) => updateClient("address", event.target.value)}
              />
              <FieldError
                field="address"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Kod pocztowy</span>
              <input
                value={form.client.postalCode}
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={6}
                onBlur={() => markTouched("postalCode")}
                onChange={(event) =>
                  updateClient("postalCode", formatPostalCode(event.target.value))
                }
                placeholder="00-001"
              />
              <FieldError
                field="postalCode"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={styles.field}>
              <span>Miasto</span>
              <input
                value={form.client.city}
                autoComplete="address-level2"
                onBlur={() => markTouched("city")}
                onChange={(event) => updateClient("city", event.target.value)}
              />
              <FieldError field="city" errors={currentErrors} touched={touched} />
            </label>

            <label className={styles.field}>
              <span>Kraj</span>
              <input
                value={form.client.country}
                autoComplete="country-name"
                onBlur={() => markTouched("country")}
                onChange={(event) => updateClient("country", event.target.value)}
              />
              <FieldError
                field="country"
                errors={currentErrors}
                touched={touched}
              />
            </label>

            <label className={`${styles.field} ${styles.wide}`}>
              <span>Numer konta bankowego</span>
              <input
                value={form.client.iban}
                autoComplete="off"
                inputMode="numeric"
                maxLength={35}
                onBlur={() => markTouched("iban")}
                onChange={(event) =>
                  updateClient("iban", formatPolishIban(event.target.value))
                }
                placeholder="PL 11 1111 1111 1111 1111 1111 1111"
              />
              <FieldError field="iban" errors={currentErrors} touched={touched} />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className={styles.passengerList}>
            {form.passengersCount === 1 ? (
              <div className={styles.notice}>
                Wniosek dotyczy jednego pasażera — nie musisz dodawać kolejnych
                osób.
              </div>
            ) : (
              form.additionalPassengers.map((passenger, index) => (
                <section key={index} className={styles.passengerCard}>
                  <div className={styles.passengerHead}>
                    <h2>Pasażer {index + 2}</h2>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removePassenger(index)}
                    >
                      Usuń
                    </button>
                  </div>
                  <label className={styles.field}>
                    <span>Imię i nazwisko</span>
                    <input
                      value={passenger.fullName}
                      onBlur={() => markTouched(`passenger-${index}-fullName`)}
                      onChange={(event) =>
                        updateAdditionalPassenger(
                          index,
                          "fullName",
                          event.target.value,
                        )
                      }
                    />
                    <FieldError
                      field={`passenger-${index}-fullName`}
                      errors={currentErrors}
                      touched={touched}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>PESEL</span>
                    <input
                      value={passenger.pesel}
                      inputMode="numeric"
                      onBlur={() => markTouched(`passenger-${index}-pesel`)}
                      onChange={(event) =>
                        updateAdditionalPassenger(
                          index,
                          "pesel",
                          onlyDigits(event.target.value).slice(0, 11),
                        )
                      }
                    />
                    <FieldError
                      field={`passenger-${index}-pesel`}
                      errors={currentErrors}
                      touched={touched}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Seria i nr dokumentu</span>
                    <input
                      value={passenger.identityDocument}
                      onBlur={() =>
                        markTouched(`passenger-${index}-identityDocument`)
                      }
                      onChange={(event) =>
                        updateAdditionalPassenger(
                          index,
                          "identityDocument",
                          event.target.value,
                        )
                      }
                    />
                    <FieldError
                      field={`passenger-${index}-identityDocument`}
                      errors={currentErrors}
                      touched={touched}
                    />
                  </label>
                </section>
              ))
            )}

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addPassenger}
              disabled={form.passengersCount >= 9}
            >
              + Dodaj pasażera
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className={styles.confirm}>
            <section className={styles.summary}>
              <h2>Podsumowanie</h2>
              <dl>
                <div>
                  <dt>Lot</dt>
                  <dd>{form.flightNumber}</dd>
                </div>
                <div>
                  <dt>Data</dt>
                  <dd>{form.flightDate}</dd>
                </div>
                <div>
                  <dt>Powód</dt>
                  <dd>{payloadReasonLabels[form.reason]}</dd>
                </div>
                <div>
                  <dt>Pasażerowie</dt>
                  <dd>{form.passengersCount}</dd>
                </div>
                <div>
                  <dt>Lotniska</dt>
                  <dd>
                    {form.departureAirportCode} → {form.arrivalAirportCode}
                  </dd>
                </div>
                <div>
                  <dt>Klient</dt>
                  <dd>
                    {form.client.firstName} {form.client.lastName}
                  </dd>
                </div>
                <div>
                  <dt>Szacowana kwota</dt>
                  <dd>{estimatedAmount ? `${estimatedAmount} EUR` : "Do oceny"}</dd>
                </div>
              </dl>
            </section>

            <div className={styles.consentList}>
              {isAdmin ? (
                <label className={styles.consentItem}>
                  <input
                    type="checkbox"
                    checked={form.consents.offlineAccepted}
                    onBlur={() => markTouched("offlineAccepted")}
                    onChange={(event) =>
                      updateConsent("offlineAccepted", event.target.checked)
                    }
                  />
                  <span>Zgody udzielone przez klienta offline</span>
                </label>
              ) : (
                <>
                  <ConsentItem
                    field="termsAccepted"
                    label="Akceptuję Regulamin i Politykę Prywatności oweme"
                    documentKey="terms"
                    checked={form.consents.termsAccepted}
                    errors={currentErrors}
                    touched={touched}
                    onOpenDocument={setOpenDocument}
                    onBlur={markTouched}
                    onChange={(checked) =>
                      updateConsent("termsAccepted", checked)
                    }
                  />
                  <ConsentItem
                    field="assignmentAccepted"
                    label="Wyrażam zgodę na zawarcie Umowy Cesji Wierzytelności i upoważniam oweme do reprezentowania mnie"
                    documentKey="assignment"
                    checked={form.consents.assignmentAccepted}
                    errors={currentErrors}
                    touched={touched}
                    onOpenDocument={setOpenDocument}
                    onBlur={markTouched}
                    onChange={(checked) =>
                      updateConsent("assignmentAccepted", checked)
                    }
                  />
                  <ConsentItem
                    field="rodoAccepted"
                    label="Wyrażam zgodę na przetwarzanie danych osobowych zgodnie z Klauzulą RODO oweme"
                    documentKey="rodo"
                    checked={form.consents.rodoAccepted}
                    errors={currentErrors}
                    touched={touched}
                    onOpenDocument={setOpenDocument}
                    onBlur={markTouched}
                    onChange={(checked) => updateConsent("rodoAccepted", checked)}
                  />
                  <ConsentItem
                    field="powerOfAttorneyAccepted"
                    label="Udzielam Pełnomocnictwa oweme sp. z o.o. do działania w moim imieniu wobec przewoźnika i sądów"
                    documentKey="powerOfAttorney"
                    checked={form.consents.powerOfAttorneyAccepted}
                    errors={currentErrors}
                    touched={touched}
                    onOpenDocument={setOpenDocument}
                    onBlur={markTouched}
                    onChange={(checked) =>
                      updateConsent("powerOfAttorneyAccepted", checked)
                    }
                  />
                  <label className={styles.consentItem}>
                    <input
                      type="checkbox"
                      checked={form.consents.marketingAccepted}
                      onChange={(event) =>
                        updateConsent("marketingAccepted", event.target.checked)
                      }
                    />
                    <span>Chcę otrzymywać informacje marketingowe od oweme</span>
                  </label>
                </>
              )}
            </div>
          </div>
        ) : null}

        {submitError ? <p className={styles.submitError}>{submitError}</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={goBack}
            disabled={step === 1 || isSubmitting}
          >
            Wstecz
          </button>

          {step < 4 ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={goNext}
              disabled={hasCurrentStepErrors || isSubmitting}
            >
              Dalej
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSubmit}
              disabled={hasCurrentStepErrors || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Wysyłam wniosek...
                </>
              ) : isAdmin ? (
                "Utwórz sprawę"
              ) : (
                "Złóż wniosek"
              )}
            </button>
          )}
        </div>
      </div>

      {openDocument ? (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal} role="dialog" aria-modal="true">
            <h2>{consentDocuments[openDocument].title}</h2>
            <p>{consentDocuments[openDocument].body}</p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setOpenDocument(null)}
            >
              Zamknij
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ConsentItem({
  field,
  label,
  documentKey,
  checked,
  errors,
  touched,
  onOpenDocument,
  onBlur,
  onChange,
}: {
  field: string;
  label: string;
  documentKey: ConsentDocumentKey;
  checked: boolean;
  errors: FieldErrors;
  touched: Record<string, boolean>;
  onOpenDocument: (document: ConsentDocumentKey) => void;
  onBlur: (field: string) => void;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <label className={styles.consentItem}>
        <input
          type="checkbox"
          checked={checked}
          onBlur={() => onBlur(field)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
        <button
          type="button"
          className={styles.documentButton}
          onClick={() => onOpenDocument(documentKey)}
        >
          Czytaj dokument
        </button>
      </label>
      <FieldError field={field} errors={errors} touched={touched} />
    </div>
  );
}
