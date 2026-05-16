import { HeroSearch } from '../FlightChecker/Landing/HeroSearch'
import styles from './Hero.module.css'

const CHECKS = [
  'Bezpłatna weryfikacja roszczenia',
  'Szybko i bez opłat z góry',
  'Do 600 € za opóźniony lub odwołany lot',
] as const

function CheckIcon() {
  return (
    <span className={styles.checkIcon} aria-hidden="true">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M3.2 7.1l2.5 2.5 5.1-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function Hero() {
  return (
    <section className={styles.hero} id="checker">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 className={styles.h1}>
            Opóźniony lub odwołany lot?
            <span>Odzyskaj do 600 €!</span>
          </h1>

          <p className={styles.desc}>
            Bez opłaty wstępnej. Pobieramy prowizję tylko wtedy, gdy wygrasz!
          </p>
        </div>

        <div className={styles.searchPanel}>
          <HeroSearch variant="landingCard" />
        </div>

        <div className={styles.benefits} aria-label="Korzyści">
          <ul className={styles.checks}>
            {CHECKS.map((item) => (
              <li key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
