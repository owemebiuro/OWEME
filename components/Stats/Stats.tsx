import { STATS } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './Stats.module.css'

export function Stats() {
  return (
    <section className={styles.section} aria-label="Statystyki oweme">
      <div className={styles.grid}>
        {STATS.map((stat, index) => (
          <RevealWrapper key={stat.label} delay={index * 0.07}>
            <div className={styles.item}>
              <div className={styles.value}>
                {stat.value}
                <span>{stat.suffix}</span>
              </div>
              <div className={styles.label}>{stat.label}</div>
              <div className={styles.note}>{stat.note}</div>
            </div>
          </RevealWrapper>
        ))}
      </div>
    </section>
  )
}
