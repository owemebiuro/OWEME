'use client'

import type { ReactNode } from 'react'
import { useClaimStore, type ClaimTab } from './claimStore'
import styles from './ClaimCard.module.css'

const TABS: Array<{ key: ClaimTab; label: string; title: string; icon: ReactNode }> = [
  {
    key: 'manual',
    label: 'Numer lotu',
    title: 'Sprawdź lot po numerze',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 16V8l-8.5 4L4 8v8l8.5-4L21 16z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12.5 12v8M8.5 14l4 6 4-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'boarding',
    label: 'Karta pokładowa',
    title: 'Prześlij kartę pokładową',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 10h7M7 14h4M16 13h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'delay',
    label: 'Opóźnienie',
    title: 'Lot opóźniony 3h+',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'cancel',
    label: 'Odwołanie',
    title: 'Lot odwołany',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function SidebarTabs() {
  const { activeTab, setTab } = useClaimStore()

  return (
    <div className={styles.sidebar} role="tablist" aria-label="Sposób weryfikacji roszczenia">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key

        return (
          <button
            key={tab.key}
            id={`claim-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`claim-panel-${tab.key}`}
            className={[styles.tab, isActive ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab(tab.key, tab.title)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
