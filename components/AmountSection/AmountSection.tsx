import { RevealWrapper } from '@/components/ui/RevealWrapper'
import { AmountSlider } from './AmountSlider'
import { DisruptionList } from './DisruptionList'
import styles from './AmountSection.module.css'

export function AmountSection() {
  return (
    <section className={styles.section} id="ile-mozesz" aria-label="Ile mozesz odzyskac">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <div className={styles.tag}>Kwoty odszkodowan</div>
            <h2 className={styles.h2}>Ile mozesz odzyskac?</h2>
            <p className={styles.lead}>
              Wysokosc odszkodowania zalezy od dlugosci trasy. Przesun suwak,
              aby zobaczyc kwote dla Twojego lotu.
            </p>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          <RevealWrapper delay={0.08}>
            <AmountSlider />
          </RevealWrapper>
          <RevealWrapper delay={0.14}>
            <DisruptionList />
          </RevealWrapper>
        </div>
      </div>
    </section>
  )
}
