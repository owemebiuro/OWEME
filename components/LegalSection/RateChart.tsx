import styles from './LegalSection.module.css'

const WIN_RATE = 87

export function RateChart() {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - WIN_RATE / 100)

  return (
    <div className={styles.chart}>
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        aria-label={`${WIN_RATE}% spraw zakończonych wygraną`}
        role="img"
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--c-line)"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--c-ember)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className={styles.chartCenter}>
        <div className={styles.chartValue}>{WIN_RATE}%</div>
        <div className={styles.chartLabel}>wygranych</div>
      </div>
    </div>
  )
}
