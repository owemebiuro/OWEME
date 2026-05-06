import Link from 'next/link'
import styles from './LegalSection.module.css'

const ITEMS = [
  'Analiza sprawy bezplatna',
  'Korespondencja z linia po naszej stronie',
  'Koszty sadowe pokrywamy my',
  '25% prowizji - tylko od odzyskanej kwoty',
]

export function NoRiskBox() {
  return (
    <div className={styles.noRisk}>
      <div className={styles.noRiskHeader}>
        <div className={styles.noRiskIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="var(--c-sage)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 12l2.5 2.5 5-5"
              stroke="var(--c-sage)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className={styles.noRiskTitle}>Bez ryzyka finansowego</h3>
      </div>

      <p className={styles.noRiskDesc}>
        oweme dziala w modelu success fee - pobieramy prowizje{' '}
        <strong>25% tylko od wyegzekwowanej kwoty</strong>. Jesli nie wygramy,
        nie zaplacisz nic.
      </p>

      <div className={styles.noRiskItems}>
        {ITEMS.map((item) => (
          <div key={item} className={styles.noRiskItem}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" fill="var(--c-sage-bg)" stroke="var(--c-sage)" strokeWidth="1" />
              <path d="M4.5 7l2 2 3-3" stroke="var(--c-sage)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item}
          </div>
        ))}
      </div>

      <Link href="#checker" className={styles.noRiskCta}>
        Sprawdz swoje roszczenie
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="14" height="14">
          <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
