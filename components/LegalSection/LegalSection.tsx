import { RevealWrapper } from '@/components/ui/RevealWrapper'
import { Credentials } from './Credentials'
import { NoRiskBox } from './NoRiskBox'
import { RateChart } from './RateChart'
import styles from './LegalSection.module.css'

export function LegalSection() {
  return (
    <section className={styles.section} aria-label="Zaufaj prawnikom oweme">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <div className={styles.tag}>Dlaczego oweme?</div>
            <h2 className={styles.h2}>Prawnicy z doswiadczeniem, nie bot</h2>
            <p className={styles.lead}>
              Kazda sprawa zajmuja sie wpisani do samorzadow adwokaci i radcowie
              prawni. Nie sprzedajemy roszczen funduszom - jestesmy Twoim
              pelnomocnikiem do konca.
            </p>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          <RevealWrapper delay={0.06}>
            <div className={styles.leftCol}>
              <Credentials />
              <div className={styles.rateRow}>
                <RateChart />
                <div className={styles.rateText}>
                  <div className={styles.rateTitle}>87% spraw zakonczonych wygrana</div>
                  <div className={styles.rateSub}>
                    W tym sprawy, w ktorych linie powolaly sie na sile wyzsza lub
                    odmowily wyplaty bez uzasadnienia.
                  </div>
                </div>
              </div>
            </div>
          </RevealWrapper>

          <RevealWrapper delay={0.12}>
            <NoRiskBox />
          </RevealWrapper>
        </div>
      </div>
    </section>
  )
}
