import { NO_RISK_ITEMS } from '@/lib/constants'
import styles from './LegalTrust.module.css'

export function NoRiskBox() {
  return (
    <div className={styles.noRisk}>
      <h3>Jeśli przegramy — płacisz zero.</h3>
      <p>
        Działamy w modelu success fee. Finansujemy analizę, korespondencję z linią
        i koszty postępowania, a prowizję pobieramy wyłącznie po skutecznej wypłacie.
      </p>
      <ul>
        {NO_RISK_ITEMS.map((item) => (
          <li key={item}>
            <span aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M3.2 7.1l2.5 2.5 5.1-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
