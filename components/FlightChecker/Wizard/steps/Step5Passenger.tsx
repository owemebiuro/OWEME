"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { WizardCard } from "../ui/WizardCard";
import { useWizardStore } from "../wizardStore";
import styles from "../Wizard.module.css";

const passengerSchema = z.object({
  firstName: z.string().trim().min(2, "Wymagane"),
  lastName: z.string().trim().min(2, "Wymagane"),
  email: z.string().trim().email("Nieprawidłowy e-mail"),
  termsAgreed: z.literal(true, { error: () => "Wymagane" }),
  newsletter: z.boolean().optional(),
});

type PassengerFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  termsAgreed: boolean;
  newsletter: boolean;
};

type PassengerField = keyof PassengerFormValues;
type PassengerErrors = Partial<Record<PassengerField, string>>;

function getPassengerErrors(values: PassengerFormValues) {
  const parsed = passengerSchema.safeParse(values);
  const errors: PassengerErrors = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && field in values) {
        errors[field as PassengerField] = issue.message;
      }
    }
  }

  return { parsed, errors };
}

export function Step5Passenger() {
  const setData = useWizardStore((state) => state.setData);
  const {
    control,
    register,
    setValue,
    formState: { touchedFields },
  } = useForm<PassengerFormValues>({
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      termsAgreed: false,
      newsletter: false,
    },
  });
  const values = useWatch({ control });
  const completeValues: PassengerFormValues = useMemo(
    () => ({
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      email: values.email ?? "",
      termsAgreed: values.termsAgreed ?? false,
      newsletter: values.newsletter ?? false,
    }),
    [
      values.email,
      values.firstName,
      values.lastName,
      values.newsletter,
      values.termsAgreed,
    ],
  );
  const { parsed, errors } = useMemo(
    () => getPassengerErrors(completeValues),
    [completeValues],
  );
  const allChecked = completeValues.termsAgreed && completeValues.newsletter;

  useEffect(() => {
    if (parsed.success) {
      setData({
        passenger: {
          ...parsed.data,
          newsletter: parsed.data.newsletter ?? false,
        },
      });
      return;
    }

    setData({ passenger: null });
  }, [parsed, setData]);

  function showError(field: PassengerField) {
    const hasValue = Boolean(completeValues[field]);
    return Boolean(errors[field] && (touchedFields[field] || hasValue));
  }

  function setAll(value: boolean) {
    setValue("termsAgreed", value, { shouldTouch: true });
    setValue("newsletter", value, { shouldTouch: true });
  }

  return (
    <>
      <WizardCard>
        <h2 className={styles.passengerTitle}>
          Potrzebuję kilku informacji o pasażerze, żeby ruszyć sprawę.
        </h2>
        <div className={styles.formGrid}>
          <label>
            <span className={styles.formLabel}>Imię</span>
            <input
              className={`${styles.textInput} ${
                showError("firstName") ? styles.inputError : ""
              }`}
              {...register("firstName")}
            />
            <p className={styles.hint}>
              Podaj imię tak jak widnieje w dokumencie tożsamości.
            </p>
            {showError("firstName") ? (
              <p className={styles.fieldError}>{errors.firstName}</p>
            ) : null}
          </label>

          <label>
            <span className={styles.formLabel}>Nazwisko</span>
            <input
              className={`${styles.textInput} ${
                showError("lastName") ? styles.inputError : ""
              }`}
              {...register("lastName")}
            />
            <p className={styles.hint}>
              Podaj wszystkie nazwiska tak jak widnieją w dokumencie.
            </p>
            {showError("lastName") ? (
              <p className={styles.fieldError}>{errors.lastName}</p>
            ) : null}
          </label>

          <label>
            <span className={styles.formLabel}>E-mail</span>
            <input
              type="email"
              className={`${styles.textInput} ${
                showError("email") ? styles.inputError : ""
              }`}
              {...register("email")}
            />
            {showError("email") ? (
              <p className={styles.fieldError}>{errors.email}</p>
            ) : null}
          </label>
        </div>
      </WizardCard>

      <WizardCard>
        <div className={styles.checkboxList}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(event) => setAll(event.target.checked)}
            />
            <span>Zaznacz wszystko</span>
          </label>
          <label className={styles.checkboxRow}>
            <input type="checkbox" {...register("termsAgreed")} />
            <span>Zgadzam się z Regulaminem i Polityką prywatności.</span>
          </label>
          {showError("termsAgreed") ? (
            <p className={styles.fieldError}>{errors.termsAgreed}</p>
          ) : null}
          <label className={styles.checkboxRow}>
            <input type="checkbox" {...register("newsletter")} />
            <span>Subskrybuj alerty o prawach pasażera i statusie spraw.</span>
          </label>
        </div>
      </WizardCard>
    </>
  );
}
