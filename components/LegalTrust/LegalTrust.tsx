import { RevealWrapper } from '@/components/ui/RevealWrapper'
import { CredsList } from './CredsList'
import { NoRiskBox } from './NoRiskBox'
import { RateChart } from './RateChart'
import styles from './LegalTrust.module.css'

export function LegalTrust() {
  return (
    <section className={styles.section} id="bez-ryzyka">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <span>99,7% spraw obsłużonych bez opłat z góry</span>
            <h2>Jedna opłata. Zero ryzyka. Wszystko obsłużone.</h2>
            <p>
              Nie płacisz z własnej kieszeni za analizę, korespondencję ani dalsze
              kroki. Prowizję pobieramy dopiero z odzyskanego odszkodowania.
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
