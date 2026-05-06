'use client'

import { useClaimStore } from './claimStore'
import { ClaimResult } from './ClaimResult'
import { PanelBoarding } from './PanelBoarding'
import { PanelCancel } from './PanelCancel'
import { PanelDelay } from './PanelDelay'
import { PanelManual } from './PanelManual'
import { SidebarTabs } from './SidebarTabs'
import styles from './ClaimCard.module.css'

export function ClaimCard() {
  const { activeTab, cardTitle, result, reset, lastDisruption } = useClaimStore()

  return (
    <div className={styles.card}>
      <SidebarTabs />
      <div className={styles.formArea}>
        <div className={styles.cardHeader}>
          <span className={styles.eyebrow}>Bezpłatna weryfikacja</span>
          <h2 className={styles.cardTitle}>{result ? 'Wstępna kwalifikacja' : cardTitle}</h2>
          {!result && <p className={styles.cardSub}>Sprawdź, ile linia lotnicza może być Ci winna.</p>}
        </div>

        {result ? (
          <ClaimResult result={result} disruption={lastDisruption ?? 'delay'} onReset={reset} />
        ) : (
          <div className={styles.panelShell}>
            {activeTab === 'manual' && <PanelManual />}
            {activeTab === 'boarding' && <PanelBoarding />}
            {activeTab === 'delay' && <PanelDelay />}
            {activeTab === 'cancel' && <PanelCancel />}
          </div>
        )}

        <p className={styles.cardFootnote}>Bez opłat z góry · bez zobowiązań · dane szyfrowane</p>
      </div>
    </div>
  )
}
