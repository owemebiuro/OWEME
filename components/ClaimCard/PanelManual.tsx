'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { CLAIM_AMOUNTS } from '@/lib/constants'
import { claimSchema, type ClaimFormData } from '@/lib/schemas'
import type { ClaimResult, DisruptionType } from '@/types/claim'
import { useClaimStore } from './claimStore'
import styles from './ClaimCard.module.css'

interface PanelManualProps {
  lockedDisruption?: DisruptionType
  helper?: string
}

export function PanelManual({ lockedDisruption, helper }: PanelManualProps) {
  const { setResult, setLoading, isLoading } = useClaimStore()

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      flightNumber: '',
      flightDate: '',
      disruption: lockedDisruption,
    },
  })

  const clearErrorAfterDelay = (field: keyof ClaimFormData) => {
    window.setTimeout(() => clearErrors(field), 1800)
  }

  async function onSubmit(data: ClaimFormData) {
    setLoading(true)

    try {
      const response = await api.post<ClaimResult>('/claims/verify', data)
      setResult(response.data, data.disruption)
    } catch {
      setResult(
        {
          eligible: true,
          amount: CLAIM_AMOUNTS[data.disruption].numeric,
          currency: 'EUR',
          flightInfo: {
            number: data.flightNumber.replace(/\s+/g, '').toUpperCase(),
            date: data.flightDate,
            route: 'WAW — LHR',
          },
          regulation: 'EC261',
        },
        data.disruption
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      id={`claim-panel-${lockedDisruption ?? 'manual'}`}
      role="tabpanel"
      aria-labelledby={`claim-tab-${lockedDisruption ?? 'manual'}`}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={styles.form}
    >
      {helper && <p className={styles.panelHint}>{helper}</p>}

      <div className={styles.formGroup}>
        <label htmlFor={`flightNumber-${lockedDisruption ?? 'manual'}`} className={styles.label}>
          Numer lotu
        </label>
        <input
          id={`flightNumber-${lockedDisruption ?? 'manual'}`}
          type="text"
          placeholder="LO231"
          autoComplete="off"
          className={[styles.input, errors.flightNumber ? styles.inputError : ''].join(' ')}
          {...register('flightNumber', {
            onChange: () => clearErrorAfterDelay('flightNumber'),
            onBlur: () => clearErrors('flightNumber'),
          })}
        />
        {errors.flightNumber && (
          <p className={styles.fieldError} role="alert">
            {errors.flightNumber.message}
          </p>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor={`flightDate-${lockedDisruption ?? 'manual'}`} className={styles.label}>
          Data lotu
        </label>
        <input
          id={`flightDate-${lockedDisruption ?? 'manual'}`}
          type="date"
          max={new Date().toISOString().split('T')[0]}
          className={[styles.input, errors.flightDate ? styles.inputError : ''].join(' ')}
          {...register('flightDate', {
            onChange: () => clearErrorAfterDelay('flightDate'),
            onBlur: () => clearErrors('flightDate'),
          })}
        />
        {errors.flightDate && (
          <p className={styles.fieldError} role="alert">
            {errors.flightDate.message}
          </p>
        )}
      </div>

      {lockedDisruption ? (
        <input type="hidden" value={lockedDisruption} {...register('disruption')} />
      ) : (
        <div className={styles.formGroup}>
          <label htmlFor="disruption" className={styles.label}>
            Rodzaj zakłócenia
          </label>
          <select
            id="disruption"
            defaultValue=""
            className={[styles.input, styles.select, errors.disruption ? styles.inputError : ''].join(' ')}
            {...register('disruption', {
              onChange: () => clearErrorAfterDelay('disruption'),
              onBlur: () => clearErrors('disruption'),
            })}
          >
            <option value="" disabled>
              Wybierz rodzaj zakłócenia
            </option>
            <option value="delay">Opóźnienie lotu</option>
            <option value="cancel">Odwołanie lotu</option>
            <option value="denied">Odmowa wejścia na pokład</option>
            <option value="missed">Nieudana przesiadka</option>
          </select>
          {errors.disruption && (
            <p className={styles.fieldError} role="alert">
              {errors.disruption.message}
            </p>
          )}
        </div>
      )}

      <button type="submit" className={styles.submitBtn} disabled={isLoading}>
        {isLoading ? <span className={styles.btnSpinner} aria-hidden="true" /> : null}
        {isLoading ? 'Weryfikujemy...' : 'Sprawdź roszczenie'}
        {!isLoading && (
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="14" height="14">
            <path
              d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </form>
  )
}
