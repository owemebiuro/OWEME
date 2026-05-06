import { DISRUPTION_LIST } from '@/lib/constants'
import styles from './AmountSection.module.css'

const ICONS: Record<string, React.ReactNode> = {
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--c-ember)" strokeWidth="1.8" />
      <path d="M12 7v5.5l3 2" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'x-circle': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--c-ember)" strokeWidth="1.8" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  'user-x': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="var(--c-ember)" strokeWidth="1.8" />
      <path d="M20 8l-4 4M16 8l4 4" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  shuffle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export function DisruptionList() {
  return (
    <ul className={styles.disruptionList}>
      {DISRUPTION_LIST.map((item) => (
        <li key={item.title} className={styles.disruptionItem}>
          <div className={styles.disruptionIcon}>{ICONS[item.icon]}</div>
          <div>
            <div className={styles.disruptionTitle}>{item.title}</div>
            <div className={styles.disruptionDesc}>{item.desc}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
