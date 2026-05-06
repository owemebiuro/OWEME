import { AWARDS } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './Awards.module.css'

function AwardIcon({ icon }: { icon: (typeof AWARDS)[number]['icon'] }) {
  if (icon === 'shield') {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (icon === 'star') {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 13l-1.5 8 4.5-2.6 4.5 2.6L15 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Awards() {
  return (
    <section className={styles.section} aria-label="Nagrody i wyróżnienia">
      <div className={styles.inner}>
        <RevealWrapper>
          <h2>Nagrody i wyróżnienia dla oweme.</h2>
        </RevealWrapper>
        <div className={styles.grid}>
          {AWARDS.map((award, index) => (
            <RevealWrapper key={award.title} delay={index * 0.07}>
              <article className={styles.card}>
                <span className={styles.badge}>
                  <AwardIcon icon={award.icon} />
                </span>
                <h3>{award.title}</h3>
                <p>{award.desc}</p>
              </article>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
