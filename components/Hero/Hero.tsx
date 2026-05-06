import { ClaimCard } from '../ClaimCard/ClaimCard'
import styles from './Hero.module.css'

const CHECKS = [
  '400 € to średnia kwota odszkodowania za opóźniony lot w UE.',
  'Bezpłatnie analizujemy sprawę i przejmujemy kontakt z linią.',
  'Pieniądze na Twoim koncie — prowizję pobieramy tylko po wygranej.',
] as const

function StarRow() {
  return (
    <span className={styles.stars} aria-hidden="true">
      ★★★★★
    </span>
  )
}

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
        <div className={styles.left}>
          <div className={styles.rating}>
            <span>Google</span>
            <StarRow />
            <strong>4,9 / 1 284 opinie</strong>
          </div>

          <h1 className={styles.h1}>
            Dodatkowe pieniądze za
            <span>opóźniony lot</span>
          </h1>

          <p className={styles.desc}>
            Adwokaci i radcowie prawni oweme dochodzą odszkodowań od linii lotniczych
            na podstawie EC 261/2004. Bez opłat z góry, bez ryzyka i bez rozmów z przewoźnikiem.
          </p>

          <ul className={styles.checks}>
            {CHECKS.map((item) => (
              <li key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.right}>
          <ClaimCard />
        </div>
      </div>
    </section>
  )
}
