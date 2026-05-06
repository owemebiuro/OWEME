import { CREDENTIALS } from '@/lib/constants'
import styles from './LegalSection.module.css'

const ICONS: Record<string, React.ReactNode> = {
  'check-circle': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--c-ember)" strokeWidth="1.8" />
      <path d="M7.5 12l3 3 6-6" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  briefcase: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="var(--c-ember)" strokeWidth="1.8" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  globe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--c-ember)" strokeWidth="1.8" />
      <path d="M2.5 9h19M2.5 15h19M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
}

export function Credentials() {
  return (
    <ul className={styles.credList}>
      {CREDENTIALS.map((c) => (
        <li key={c.title} className={styles.credItem}>
          <div className={styles.credIcon}>{ICONS[c.icon]}</div>
          <div>
            <div className={styles.credTitle}>{c.title}</div>
            <div className={styles.credSub}>{c.sub}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
