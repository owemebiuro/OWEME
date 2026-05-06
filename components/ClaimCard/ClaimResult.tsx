'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CLAIM_AMOUNTS } from '@/lib/constants'
import type { ClaimResult as ClaimResultType, DisruptionType } from '@/types/claim'
import styles from './ClaimCard.module.css'

interface Props {
  result: ClaimResultType
  disruption: DisruptionType
  onReset: () => void
}

export function ClaimResult({ result, disruption, onReset }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const badge = CLAIM_AMOUNTS[disruption].badge

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      className={styles.result}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
    >
      <div className={styles.resultTop}>
        <div>
          <div className={styles.resultFlightNo}>{result.flightInfo.number}</div>
          <div className={styles.resultRoute}>
            {result.flightInfo.route ?? 'Trasa do potwierdzenia'} ·{' '}
            {new Date(result.flightInfo.date).toLocaleDateString('pl-PL')}
          </div>
        </div>
        <span className={styles.resultBadge}>{badge}</span>
      </div>

      <div className={styles.amountBlock}>
        <p>Szacowane odszkodowanie</p>
        <div className={styles.resultAmount}>{result.amount} €</div>
      </div>

      <div className={styles.eligible}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="8" stroke="var(--sage)" strokeWidth="1.6" />
          <path d="M5.5 9l2.3 2.4 4.9-5" stroke="var(--sage)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Kwalifikujesz się — EC 261/2004
      </div>

      <div className={styles.progressWrap} aria-label="Etapy sprawy">
        <div className={styles.progressTrack}>
          <motion.div
            className={styles.progressFill}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.33 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        <div className={styles.progressLabels}>
          <span>Weryfikacja</span>
          <span>Do linii</span>
          <span>Wypłata</span>
        </div>
      </div>

      <Link href="/formularz" className={styles.resultCta}>
        Złóż wniosek
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="14" height="14">
          <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <button type="button" onClick={onReset} className={styles.resultReset}>
        Sprawdź inny lot
      </button>
    </motion.div>
  )
}
