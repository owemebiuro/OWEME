import { RevealWrapper } from '@/components/ui/RevealWrapper'
import { DistanceCompensationChecker } from './DistanceCompensationChecker'
import { DisruptionList } from './DisruptionList'
import styles from './AmountSection.module.css'

export function AmountSection() {
  return (
    <section className={styles.section} id="ile-mozesz" aria-label="Ile mozesz odzyskac">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <div className={styles.tag}>Flight compensation</div>
            <h2 className={styles.h2}>Ile możesz odzyskać?</h2>
            <p className={styles.lead}>
              Wysokość odszkodowania zależy od długości trasy. Wybierz lotnisko
              startowe i docelowe, a checker policzy dystans oraz próg kwoty.
            </p>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          <RevealWrapper delay={0.08}>
            <DistanceCompensationChecker />
          </RevealWrapper>
          <RevealWrapper delay={0.14}>
            <DisruptionList />
          </RevealWrapper>
        </div>
      </div>
    </section>
  )
}
