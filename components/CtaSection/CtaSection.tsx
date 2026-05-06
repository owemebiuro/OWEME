import Link from 'next/link'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './CtaSection.module.css'

const CHECKS = ['Bez opłat z góry', 'Koszty sądowe po naszej stronie', 'Adwokaci i radcowie prawni'] as const

export function CtaSection() {
  return (
    <section className={styles.section} id="kontakt">
      <RevealWrapper>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>Sprawdź teraz</span>
          <h2>
            Ile jest Ci winna
            <span>Twoja linia lotnicza?</span>
          </h2>
          <p>
            Wpisz numer lotu lub prześlij kartę pokładową. W 60 sekund zobaczysz,
            czy Twoja sprawa kwalifikuje się do odszkodowania.
          </p>
          <div className={styles.actions}>
            <Link href="#checker" className={styles.primary}>
              Sprawdź roszczenie
              <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="14" height="14">
                <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="#jak-dziala" className={styles.ghost}>
              Jak działamy
            </Link>
          </div>
          <ul className={styles.checks}>
            {CHECKS.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
      </RevealWrapper>
    </section>
  )
}
