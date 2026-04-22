"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitClaim } from "./actions";
import styles from "./formularz.module.css";

type ClaimType = "DELAY" | "CANCELLATION" | "DENIED_BOARDING";

type AdditionalPassenger = { firstName: string; lastName: string };

type FormData = {
  // Step 1
  flightNumber: string;
  flightDate: string;
  claimType: ClaimType;
  passengerCount: number;
  flightId?: string;
  // Step 2
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  // Step 3
  additionalPassengers: AdditionalPassenger[];
  // Step 4
  acceptTerms: boolean;
  acceptCession: boolean;
  marketingConsent: boolean;
};

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  DELAY: "Opóźnienie lotu",
  CANCELLATION: "Odwołanie lotu",
  DENIED_BOARDING: "Odmowa wejścia na pokład (overbooking)",
};

const STEPS = ["Dane lotu", "Dane kontaktowe", "Pasażerowie", "Potwierdzenie"];

export default function FormClient({
  flightId,
  flightNumber: initialFlightNumber = "",
  flightDate: initialFlightDate = "",
  initialPassengers = 1,
}: {
  flightId?: string;
  flightNumber?: string;
  flightDate?: string;
  initialPassengers?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState<FormData>({
    flightNumber: initialFlightNumber,
    flightDate: initialFlightDate,
    claimType: "DELAY",
    passengerCount: Math.max(1, Math.min(9, initialPassengers)),
    flightId,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    country: "PL",
    additionalPassengers: Array.from(
      { length: Math.max(0, initialPassengers - 1) },
      () => ({ firstName: "", lastName: "" }),
    ),
    acceptTerms: false,
    acceptCession: false,
    marketingConsent: false,
  });

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function setPassenger(index: number, field: keyof AdditionalPassenger, value: string) {
    const updated = [...form.additionalPassengers];
    updated[index] = { ...updated[index], [field]: value };
    set("additionalPassengers", updated);
  }

  function handlePassengerCountChange(count: number) {
    const clamped = Math.max(1, Math.min(9, count));
    const currentExtras = form.additionalPassengers;
    const needed = clamped - 1;
    const updated =
      needed > currentExtras.length
        ? [
            ...currentExtras,
            ...Array.from({ length: needed - currentExtras.length }, () => ({
              firstName: "",
              lastName: "",
            })),
          ]
        : currentExtras.slice(0, needed);
    setForm((prev) => ({ ...prev, passengerCount: clamped, additionalPassengers: updated }));
  }

  // ── VALIDATION ──────────────────────────────────────────────────────
  function validateStep1() {
    const errs: Record<string, string> = {};
    if (!form.flightNumber.trim()) errs.flightNumber = "Podaj numer lotu";
    if (!form.flightDate) errs.flightDate = "Podaj datę lotu";
    else {
      const d = new Date(form.flightDate);
      const now = new Date();
      const minDate = new Date();
      minDate.setFullYear(now.getFullYear() - 3);
      if (d >= now) errs.flightDate = "Data musi być w przeszłości";
      else if (d < minDate) errs.flightDate = "Lot nie może być starszy niż 3 lata";
    }
    return errs;
  }

  function validateStep2() {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "Wymagane";
    if (!form.lastName.trim()) errs.lastName = "Wymagane";
    if (!form.email.trim()) errs.email = "Wymagane";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Nieprawidłowy email";
    if (!form.phone.trim() || form.phone.trim().length < 5) errs.phone = "Wymagany telefon";
    return errs;
  }

  function validateStep3() {
    const errs: Record<string, string> = {};
    form.additionalPassengers.forEach((p, i) => {
      if (!p.firstName.trim()) errs[`pax_${i}_firstName`] = "Wymagane";
      if (!p.lastName.trim()) errs[`pax_${i}_lastName`] = "Wymagane";
    });
    return errs;
  }

  function validateStep4() {
    const errs: Record<string, string> = {};
    if (!form.acceptTerms) errs.acceptTerms = "Wymagana akceptacja regulaminu";
    if (!form.acceptCession) errs.acceptCession = "Wymagana zgoda na cesję";
    return errs;
  }

  function nextStep() {
    let errs: Record<string, string> = {};
    if (step === 1) errs = validateStep1();
    if (step === 2) errs = validateStep2();
    if (step === 3) errs = validateStep3();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    // Skip step 3 if only 1 passenger
    if (step === 2 && form.passengerCount === 1) {
      setStep(4);
    } else {
      setStep((s) => s + 1);
    }
  }

  function prevStep() {
    setErrors({});
    // Skip step 3 backwards if only 1 passenger
    if (step === 4 && form.passengerCount === 1) {
      setStep(2);
    } else {
      setStep((s) => s - 1);
    }
  }

  async function handleSubmit() {
    const errs = validateStep4();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitError("");

    startTransition(async () => {
      const result = await submitClaim({
        flightNumber: form.flightNumber,
        flightDate: form.flightDate,
        claimType: form.claimType,
        passengerCount: form.passengerCount,
        flightId: form.flightId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address || undefined,
        postalCode: form.postalCode || undefined,
        city: form.city || undefined,
        country: form.country,
        additionalPassengers: form.additionalPassengers,
        acceptTerms: form.acceptTerms,
        acceptCession: form.acceptCession,
        marketingConsent: form.marketingConsent,
      });

      if (result.success) {
        router.push(`/sukces?claimNumber=${encodeURIComponent(result.claimNumber)}`);
      } else {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          const flatErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs[0]) flatErrors[key] = msgs[0];
          }
          setErrors(flatErrors);
        }
      }
    });
  }

  const visibleSteps = form.passengerCount > 1 ? STEPS : STEPS.filter((_, i) => i !== 2);
  const progressIndex = visibleSteps.findIndex((_, i) => {
    const mapped = [1, 2, form.passengerCount > 1 ? 3 : null, 4].filter(Boolean);
    return mapped[i] === step;
  });

  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    return d.toISOString().split("T")[0];
  })();

  return (
    <main className={styles.main}>
      {/* PROGRESS */}
      <div className={styles.progress}>
        {visibleSteps.map((label, i) => {
          const isActive = i === Math.max(0, progressIndex);
          const isDone = progressIndex > i;
          return (
            <div
              key={label}
              className={`${styles.progressStep} ${isActive ? styles.progressActive : ""} ${isDone ? styles.progressDone : ""}`}
            >
              <div className={styles.progressDot}>
                {isDone ? (
                  <svg viewBox="0 0 10 10" fill="none" width="10" height="10">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className={styles.progressLabel}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: FLIGHT DATA */}
      {step === 1 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Dane lotu</h2>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Numer lotu</label>
              <input
                className={`${styles.input} ${errors.flightNumber ? styles.inputError : ""}`}
                type="text"
                placeholder="np. LO123"
                value={form.flightNumber}
                readOnly={!!flightId}
                onChange={(e) => set("flightNumber", e.target.value)}
              />
              {errors.flightNumber && <span className={styles.error}>{errors.flightNumber}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Data lotu</label>
              <input
                className={`${styles.input} ${errors.flightDate ? styles.inputError : ""}`}
                type="date"
                min={minDate}
                max={maxDate}
                value={form.flightDate}
                readOnly={!!flightId}
                onChange={(e) => set("flightDate", e.target.value)}
              />
              {errors.flightDate && <span className={styles.error}>{errors.flightDate}</span>}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Powód wniosku</label>
            <div className={styles.radioGroup}>
              {(Object.entries(CLAIM_TYPE_LABELS) as [ClaimType, string][]).map(
                ([val, lbl]) => (
                  <label key={val} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="claimType"
                      value={val}
                      checked={form.claimType === val}
                      onChange={() => set("claimType", val)}
                    />
                    <span>{lbl}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Liczba pasażerów</label>
            <div className={styles.stepper}>
              <button
                className={styles.stepperBtn}
                type="button"
                onClick={() => handlePassengerCountChange(form.passengerCount - 1)}
              >
                −
              </button>
              <span className={styles.stepperVal}>{form.passengerCount}</span>
              <button
                className={styles.stepperBtn}
                type="button"
                onClick={() => handlePassengerCountChange(form.passengerCount + 1)}
              >
                +
              </button>
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={nextStep}>
            Dalej →
          </button>
        </div>
      )}

      {/* STEP 2: CONTACT DATA */}
      {step === 2 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Dane kontaktowe</h2>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Imię</label>
              <input
                className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                type="text"
                placeholder="Jan"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
              {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Nazwisko</label>
              <input
                className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                type="text"
                placeholder="Kowalski"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
              {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Adres email</label>
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              placeholder="jan@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Telefon</label>
            <input
              className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
              type="tel"
              placeholder="+48 501 234 567"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Adres zamieszkania (opcjonalnie)</label>
            <input
              className={styles.input}
              type="text"
              placeholder="ul. Marszałkowska 10"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Kod pocztowy</label>
              <input
                className={styles.input}
                type="text"
                placeholder="00-001"
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Miasto</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Warszawa"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.navRow}>
            <button className={styles.btnSecondary} onClick={prevStep}>
              ← Wróć
            </button>
            <button className={styles.btnPrimary} onClick={nextStep}>
              Dalej →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ADDITIONAL PASSENGERS */}
      {step === 3 && form.passengerCount > 1 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Dodatkowi pasażerowie</h2>
          <p className={styles.cardDesc}>
            Podaj imiona i nazwiska pozostałych pasażerów objętych wnioskiem.
          </p>

          {form.additionalPassengers.map((pax, i) => (
            <div key={i} className={styles.paxBlock}>
              <div className={styles.paxHeader}>Pasażer {i + 2}</div>
              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Imię</label>
                  <input
                    className={`${styles.input} ${errors[`pax_${i}_firstName`] ? styles.inputError : ""}`}
                    type="text"
                    placeholder="Imię"
                    value={pax.firstName}
                    onChange={(e) => setPassenger(i, "firstName", e.target.value)}
                  />
                  {errors[`pax_${i}_firstName`] && (
                    <span className={styles.error}>{errors[`pax_${i}_firstName`]}</span>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Nazwisko</label>
                  <input
                    className={`${styles.input} ${errors[`pax_${i}_lastName`] ? styles.inputError : ""}`}
                    type="text"
                    placeholder="Nazwisko"
                    value={pax.lastName}
                    onChange={(e) => setPassenger(i, "lastName", e.target.value)}
                  />
                  {errors[`pax_${i}_lastName`] && (
                    <span className={styles.error}>{errors[`pax_${i}_lastName`]}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className={styles.navRow}>
            <button className={styles.btnSecondary} onClick={prevStep}>
              ← Wróć
            </button>
            <button className={styles.btnPrimary} onClick={nextStep}>
              Dalej →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONSENTS + SUMMARY */}
      {step === 4 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Potwierdzenie</h2>

          {/* Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Lot</span>
              <span className={styles.summaryVal}>
                {form.flightNumber} · {form.flightDate}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Powód</span>
              <span className={styles.summaryVal}>{CLAIM_TYPE_LABELS[form.claimType]}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Pasażerowie</span>
              <span className={styles.summaryVal}>{form.passengerCount}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Klient</span>
              <span className={styles.summaryVal}>
                {form.firstName} {form.lastName}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Email</span>
              <span className={styles.summaryVal}>{form.email}</span>
            </div>
          </div>

          {/* Consents */}
          <div className={styles.consentsBlock}>
            <label className={`${styles.checkLabel} ${errors.acceptTerms ? styles.checkLabelError : ""}`}>
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => set("acceptTerms", e.target.checked)}
              />
              <span>
                Akceptuję{" "}
                <a href="/regulamin" target="_blank" rel="noreferrer">
                  regulamin
                </a>{" "}
                i{" "}
                <a href="/polityka-prywatnosci" target="_blank" rel="noreferrer">
                  politykę prywatności
                </a>{" "}
                <span className={styles.required}>*</span>
              </span>
            </label>
            {errors.acceptTerms && (
              <span className={styles.error}>{errors.acceptTerms}</span>
            )}

            <label className={`${styles.checkLabel} ${errors.acceptCession ? styles.checkLabelError : ""}`}>
              <input
                type="checkbox"
                checked={form.acceptCession}
                onChange={(e) => set("acceptCession", e.target.checked)}
              />
              <span>
                Wyrażam zgodę na cesję wierzytelności na OWEME sp. z o.o.{" "}
                <span className={styles.required}>*</span>
              </span>
            </label>
            {errors.acceptCession && (
              <span className={styles.error}>{errors.acceptCession}</span>
            )}

            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(e) => set("marketingConsent", e.target.checked)}
              />
              <span>
                Wyrażam zgodę na kontakt marketingowy (opcjonalnie)
              </span>
            </label>
          </div>

          {submitError && <div className={styles.errorBox}>{submitError}</div>}

          <div className={styles.navRow}>
            <button className={styles.btnSecondary} onClick={prevStep} disabled={isPending}>
              ← Wróć
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className={styles.spinner} />
                  Składam wniosek...
                </>
              ) : (
                "Złóż wniosek"
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
