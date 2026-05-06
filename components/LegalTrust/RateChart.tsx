import { RATE_ROWS } from '@/lib/constants'
import styles from './LegalTrust.module.css'

export function RateChart() {
  return (
    <div className={styles.rateBox}>
      <span className={styles.rateEyebrow}>Skuteczność — jak wygrywamy</span>
      <div className={styles.rateRows}>
        {RATE_ROWS.map((row) => (
          <div key={row.label} className={styles.rateRow}>
            <div className={styles.rateLabel}>
              <span>{row.label}</span>
              <strong className={styles[row.tone]}>{row.value}%</strong>
            </div>
            <div className={styles.rateTrack}>
              <span className={styles[row.tone]} style={{ width: `${row.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p>
        13% spraw nieskwalifikowanych — najczęściej z powodu przedawnienia lub udowodnionej
        siły wyższej. Informujemy o tym na początku, nie na końcu.
      </p>
    </div>
  )
}
