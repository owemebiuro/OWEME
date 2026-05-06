import { CREDENTIALS } from '@/lib/constants'
import styles from './LegalTrust.module.css'

function CredIcon({ icon }: { icon: (typeof CREDENTIALS)[number]['icon'] }) {
  const common = { width: 21, height: 21, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const

  if (icon === 'check-circle') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7.5 12l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (icon === 'briefcase') {
    return (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (icon === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M3 15h18M12 3c-2.4 2.8-3.7 5.9-3.7 9s1.3 6.2 3.7 9M12 3c2.4 2.8 3.7 5.9 3.7 9s-1.3 6.2-3.7 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function CredsList() {
  return (
    <ul className={styles.creds}>
      {CREDENTIALS.map((credential) => (
        <li key={credential.title} className={styles.credItem}>
          <span className={styles.credIcon}>
            <CredIcon icon={credential.icon} />
          </span>
          <span>
            <strong>{credential.title}</strong>
            <small>{credential.sub}</small>
          </span>
        </li>
      ))}
    </ul>
  )
}
