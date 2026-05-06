import { HOW_STEPS } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './HowItWorks.module.css'

export function HowItWorks() {
  return (
    <section className={styles.section} id="jak-dziala">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <span>Jak działamy</span>
            <h2>Trzy kroki do wypłaty odszkodowania</h2>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          {HOW_STEPS.map((step, index) => (
            <RevealWrapper key={step.num} delay={index * 0.07}>
              <article className={styles.card}>
                <span className={styles.num}>{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
