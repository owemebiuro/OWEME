import { RevealWrapper } from '@/components/ui/RevealWrapper'
import { CredsList } from './CredsList'
import { NoRiskBox } from './NoRiskBox'
import { RateChart } from './RateChart'
import styles from './LegalTrust.module.css'

export function LegalTrust() {
  return (
    <section className={styles.section} id="prawnicy">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <span>Dlaczego oweme?</span>
            <h2>Prawnicy od EC 261/2004, nie masowa infolinia</h2>
            <p>
              Każda sprawa trafia do zespołu, który zna praktykę linii lotniczych,
              ULC i sądów cywilnych. Bez sprzedaży roszczeń dalej.
            </p>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          <RevealWrapper delay={0.07}>
            <CredsList />
          </RevealWrapper>
          <div className={styles.side}>
            <RevealWrapper delay={0.14}>
              <NoRiskBox />
            </RevealWrapper>
            <RevealWrapper delay={0.21}>
              <RateChart />
            </RevealWrapper>
          </div>
        </div>
      </div>
    </section>
  )
}
