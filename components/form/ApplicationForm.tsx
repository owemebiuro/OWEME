"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/app/landing.module.css";
import {
  submitPublicClaimApplication,
  type PublicClaimApplicationInput,
} from "@/app/formularz/actions";

type ClaimTypeValue = "DELAY" | "CANCELLATION" | "DENIED_BOARDING";

type PassengerDraft = {
  firstName: string;
  lastName: string;
};

type PrimaryPassengerDraft = PassengerDraft & {
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
};

export type ApplicationInitialData = {
  flightId?: string;
  manual: boolean;
  flightNumber: string;
  flightDate: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  delayMinutes: number | null;
  passengers: number;
};

type ApplicationState = {
  flightId?: string;
  manual: boolean;
  flightNumber: string;
  flightDate: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  delayMinutes: number | null;
  type: ClaimTypeValue;
  passengersCount: number;
  primaryPassenger: PrimaryPassengerDraft;
  additionalPassengers: PassengerDraft[];
  consents: {
    termsAccepted: boolean;
    assignmentAccepted: boolean;
    marketingAccepted: boolean;
  };
};

const flightNumberPattern = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i;
const airportCodePattern = /^[A-Z]{3}$/i;

const claimTypeLabels: Record<ClaimTypeValue, string> = {
  DELAY: "Opóźnienie",
  CANCELLATION: "Odwołanie",
  DENIED_BOARDING: "Odmowa boardingu",
};

function clampPassengers(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(9, Math.max(1, Math.round(value)));
}

function createPassengerSlots(count: number, current: PassengerDraft[] = []) {
  return Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({
    firstName: current[index]?.firstName ?? "",
    lastName: current[index]?.lastName ?? "",
  }));
}

function normalizeFlightNumber(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeAirportCode(value: string) {
  return value.trim().toUpperCase();
}

function isPastFlightDate(value: string) {
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

  return flightDate < today && flightDate >= minDate;
}

function estimateAmountPerPassenger(state: ApplicationState) {
  if (state.type === "CANCELLATION") {
    return 600;
  }

  if ((state.delayMinutes ?? 0) >= 180) {
    return 600;
  }

  return 0;
}

function buildInitialState(initialData: ApplicationInitialData): ApplicationState {
  const passengersCount = clampPassengers(initialData.passengers);

  return {
    flightId: initialData.flightId,
    manual: initialData.manual,
    flightNumber: initialData.flightNumber,
    flightDate: initialData.flightDate,
    departureAirportCode: initialData.departureAirportCode,
    arrivalAirportCode: initialData.arrivalAirportCode,
    delayMinutes: initialData.delayMinutes,
    type: "DELAY",
    passengersCount,
    primaryPassenger: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      city: "",
      country: "PL",
    },
    additionalPassengers: createPassengerSlots(passengersCount),
    consents: {
      termsAccepted: false,
      assignmentAccepted: false,
      marketingAccepted: false,
    },
  };
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getStepError(step: number, state: ApplicationState) {
  if (step === 1) {
    if (!flightNumberPattern.test(state.flightNumber.trim())) {
      return "Podaj poprawny numer lotu, np. LO123.";
    }

    if (!isPastFlightDate(state.flightDate)) {
      return "Data lotu musi być z przeszłości i maksymalnie 3 lata wstecz.";
    }

    if (
      !state.flightId &&
      (!airportCodePattern.test(state.departureAirportCode) ||
        !airportCodePattern.test(state.arrivalAirportCode))
    ) {
      return "Podaj trzyliterowe kody lotnisk wylotu i przylotu.";
    }
  }

  if (step === 2) {
    const passenger = state.primaryPassenger;

    if (!passenger.firstName.trim() || !passenger.lastName.trim()) {
      return "Podaj imię i nazwisko głównego pasażera.";
    }

    if (!validateEmail(passenger.email)) {
      return "Podaj poprawny adres email.";
    }

    if (
      !passenger.phone.trim() ||
      !passenger.address.trim() ||
      !passenger.postalCode.trim() ||
      !passenger.city.trim() ||
      !passenger.country.trim()
    ) {
      return "Uzupełnij dane kontaktowe głównego pasażera.";
    }
  }

  if (step === 3) {
    const missingPassenger = state.additionalPassengers.some(
      (passenger) => !passenger.firstName.trim() || !passenger.lastName.trim(),
    );

    if (missingPassenger) {
      return "Uzupełnij imiona i nazwiska wszystkich dodatkowych pasażerów.";
    }
  }

  if (step === 4) {
    if (!state.consents.termsAccepted || !state.consents.assignmentAccepted) {
      return "Wymagane zgody muszą być zaznaczone przed złożeniem wniosku.";
    }
  }

  return null;
}

export function ApplicationForm({
  initialData,
}: {
  initialData: ApplicationInitialData;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ApplicationState>(() =>
    buildInitialState(initialData),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountPerPassenger = useMemo(
    () => estimateAmountPerPassenger(form),
    [form],
  );
  const totalAmount = amountPerPassenger * form.passengersCount;
  const readonlyFlightFields = Boolean(
    form.flightId || initialData.flightNumber || initialData.flightDate,
  );

  function goNext() {
    const error = getStepError(step, form);
    setMessage(error);

    if (!error) {
      setStep((current) => Math.min(4, current + 1));
    }
  }

  function goBack() {
    setMessage(null);
    setStep((current) => Math.max(1, current - 1));
  }

  function updatePrimaryPassenger(
    field: keyof PrimaryPassengerDraft,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      primaryPassenger: {
        ...current.primaryPassenger,
        [field]: value,
      },
    }));
  }

  function updateAdditionalPassenger(
    index: number,
    field: keyof PassengerDraft,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      additionalPassengers: current.additionalPassengers.map((passenger, item) =>
        item === index ? { ...passenger, [field]: value } : passenger,
      ),
    }));
  }

  async function handleSubmit() {
    const error = getStepError(4, form);
    setMessage(error);

    if (error) {
      return;
    }

    setIsSubmitting(true);

    const payload: PublicClaimApplicationInput = {
      flightId: form.flightId,
      manual: form.manual,
      flightNumber: normalizeFlightNumber(form.flightNumber),
      flightDate: form.flightDate,
      departureAirportCode: normalizeAirportCode(form.departureAirportCode),
      arrivalAirportCode: normalizeAirportCode(form.arrivalAirportCode),
      delayMinutes: form.delayMinutes,
      type: form.type,
      passengersCount: form.passengersCount,
      primaryPassenger: form.primaryPassenger,
      additionalPassengers: form.additionalPassengers,
      consents: form.consents,
    };
    const result = await submitPublicClaimApplication(payload);

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    router.push(`/sukces?claimNumber=${encodeURIComponent(result.claimNumber)}`);
  }

  return (
    <div className={styles.applicationCard}>
      <div className={styles.applicationProgress}>
        <span>Krok {step}/4</span>
        <div className={styles.applicationProgressBar}>
          <div
            className={styles.applicationProgressFill}
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className={styles.applicationStepLabels} aria-label="Postęp formularza">
        {["Lot", "Kontakt", "Pasażerowie", "Zgody"].map((label, index) => (
          <span
            key={label}
            className={step === index + 1 ? styles.applicationStepActive : undefined}
          >
            {label}
          </span>
        ))}
      </div>

      {message ? <p className={styles.funnelError}>{message}</p> : null}

      {step === 1 ? (
        <div className={styles.applicationFormGrid}>
          <label className={styles.funnelField}>
            <span>Numer lotu</span>
            <input
              value={form.flightNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  flightNumber: normalizeFlightNumber(event.target.value),
                }))
              }
              readOnly={readonlyFlightFields}
              className={readonlyFlightFields ? styles.readonlyInput : undefined}
              placeholder="np. LO123"
            />
          </label>

          <label className={styles.funnelField}>
            <span>Data lotu</span>
            <input
              value={form.flightDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  flightDate: event.target.value,
                }))
              }
              readOnly={readonlyFlightFields}
              className={readonlyFlightFields ? styles.readonlyInput : undefined}
              type="date"
            />
          </label>

          <label className={styles.funnelField}>
            <span>Powód wniosku</span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as ClaimTypeValue,
                }))
              }
            >
              {Object.entries(claimTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.funnelField}>
            <span>Liczba pasażerów</span>
            <input
              value={form.passengersCount}
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
              type="number"
              min={1}
              max={9}
            />
          </label>

          {!form.flightId ? (
            <>
              <label className={styles.funnelField}>
                <span>Lotnisko wylotu</span>
                <input
                  value={form.departureAirportCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      departureAirportCode: normalizeAirportCode(
                        event.target.value,
                      ),
                    }))
                  }
                  maxLength={3}
                  placeholder="WAW"
                />
              </label>

              <label className={styles.funnelField}>
                <span>Lotnisko przylotu</span>
                <input
                  value={form.arrivalAirportCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      arrivalAirportCode: normalizeAirportCode(
                        event.target.value,
                      ),
                    }))
                  }
                  maxLength={3}
                  placeholder="LHR"
                />
              </label>

              <label className={styles.funnelField}>
                <span>Opóźnienie w minutach</span>
                <input
                  value={form.delayMinutes ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      delayMinutes: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                  inputMode="numeric"
                  placeholder="np. 240"
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.applicationFormGrid}>
          <label className={styles.funnelField}>
            <span>Imię</span>
            <input
              value={form.primaryPassenger.firstName}
              onChange={(event) =>
                updatePrimaryPassenger("firstName", event.target.value)
              }
              autoComplete="given-name"
            />
          </label>
          <label className={styles.funnelField}>
            <span>Nazwisko</span>
            <input
              value={form.primaryPassenger.lastName}
              onChange={(event) =>
                updatePrimaryPassenger("lastName", event.target.value)
              }
              autoComplete="family-name"
            />
          </label>
          <label className={styles.funnelField}>
            <span>Email</span>
            <input
              value={form.primaryPassenger.email}
              onChange={(event) =>
                updatePrimaryPassenger("email", event.target.value)
              }
              type="email"
              autoComplete="email"
            />
          </label>
          <label className={styles.funnelField}>
            <span>Telefon</span>
            <input
              value={form.primaryPassenger.phone}
              onChange={(event) =>
                updatePrimaryPassenger("phone", event.target.value)
              }
              autoComplete="tel"
            />
          </label>
          <label className={`${styles.funnelField} ${styles.applicationWide}`}>
            <span>Adres</span>
            <input
              value={form.primaryPassenger.address}
              onChange={(event) =>
                updatePrimaryPassenger("address", event.target.value)
              }
              autoComplete="street-address"
            />
          </label>
          <label className={styles.funnelField}>
            <span>Kod pocztowy</span>
            <input
              value={form.primaryPassenger.postalCode}
              onChange={(event) =>
                updatePrimaryPassenger("postalCode", event.target.value)
              }
              autoComplete="postal-code"
            />
          </label>
          <label className={styles.funnelField}>
            <span>Miasto</span>
            <input
              value={form.primaryPassenger.city}
              onChange={(event) =>
                updatePrimaryPassenger("city", event.target.value)
              }
              autoComplete="address-level2"
            />
          </label>
          <label className={styles.funnelField}>
            <span>Kraj</span>
            <input
              value={form.primaryPassenger.country}
              onChange={(event) =>
                updatePrimaryPassenger("country", event.target.value)
              }
              autoComplete="country-name"
            />
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={styles.applicationPassengers}>
          {form.passengersCount === 1 ? (
            <div className={styles.applicationNotice}>
              Wniosek dotyczy jednego pasażera, więc nie musisz dodawać kolejnych
              osób.
            </div>
          ) : (
            form.additionalPassengers.map((passenger, index) => (
              <div key={index} className={styles.passengerRow}>
                <div className={styles.passengerRowHeader}>
                  Pasażer dodatkowy {index + 2}
                </div>
                <label className={styles.funnelField}>
                  <span>Imię</span>
                  <input
                    value={passenger.firstName}
                    onChange={(event) =>
                      updateAdditionalPassenger(
                        index,
                        "firstName",
                        event.target.value,
                      )
                    }
                  />
                </label>
                <label className={styles.funnelField}>
                  <span>Nazwisko</span>
                  <input
                    value={passenger.lastName}
                    onChange={(event) =>
                      updateAdditionalPassenger(
                        index,
                        "lastName",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>
            ))
          )}
        </div>
      ) : null}

      {step === 4 ? (
        <div className={styles.applicationConfirm}>
          <div className={styles.applicationSummaryBox}>
            <h2>Podsumowanie</h2>
            <dl className={styles.funnelSummary}>
              <div>
                <dt>Lot</dt>
                <dd>{form.flightNumber || "Do uzupełnienia"}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{form.flightDate || "Do uzupełnienia"}</dd>
              </div>
              <div>
                <dt>Powód</dt>
                <dd>{claimTypeLabels[form.type]}</dd>
              </div>
              <div>
                <dt>Pasażerowie</dt>
                <dd>{form.passengersCount}</dd>
              </div>
              <div>
                <dt>Klient</dt>
                <dd>
                  {form.primaryPassenger.firstName || "Imię"}{" "}
                  {form.primaryPassenger.lastName || "nazwisko"}
                </dd>
              </div>
              <div>
                <dt>Szacowana kwota</dt>
                <dd>{totalAmount ? `${totalAmount} EUR` : "Do oceny"}</dd>
              </div>
            </dl>
          </div>

          <div className={styles.consentList}>
            <label>
              <input
                type="checkbox"
                checked={form.consents.termsAccepted}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    consents: {
                      ...current.consents,
                      termsAccepted: event.target.checked,
                    },
                  }))
                }
              />
              <span>Akceptuję regulamin i politykę prywatności OWEME.</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.consents.assignmentAccepted}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    consents: {
                      ...current.consents,
                      assignmentAccepted: event.target.checked,
                    },
                  }))
                }
              />
              <span>Wyrażam zgodę na przygotowanie cesji wierzytelności.</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.consents.marketingAccepted}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    consents: {
                      ...current.consents,
                      marketingAccepted: event.target.checked,
                    },
                  }))
                }
              />
              <span>Chcę otrzymywać informacje marketingowe od OWEME.</span>
            </label>
          </div>
        </div>
      ) : null}

      <div className={styles.applicationActions}>
        <button
          type="button"
          className={styles.applicationSecondaryButton}
          onClick={goBack}
          disabled={step === 1 || isSubmitting}
        >
          Wstecz
        </button>

        {step < 4 ? (
          <button type="button" className={styles.funnelButton} onClick={goNext}>
            Dalej
          </button>
        ) : (
          <button
            type="button"
            className={styles.funnelButton}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Wysyłam wniosek..." : "Złóż wniosek"}
          </button>
        )}
      </div>
    </div>
  );
}
