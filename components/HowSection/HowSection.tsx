import Link from 'next/link'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './HowSection.module.css'

const STEPS = [
  {
    num: '01',
    title: 'Sprawdz',
    desc: 'Wpisujesz numer lotu i date - weryfikujemy w kilka sekund, czy Twoja sprawa kwalifikuje sie do odszkodowania.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Podpisz',
    desc: 'Przygotowujemy dokumenty i prowadzimy Cie przez podpisanie cesji oraz wymaganych zgod - wszystko online.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Odbierz',
    desc: 'Prowadzimy kontakt z linia lotnicza. Po skutecznej wyplacie odszkodowania przekazujemy Ci srodki.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
]

export function HowSection() {
  return (
    <section className={styles.section} id="jak-dziala" aria-label="Jak dzialamy">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <div className={styles.tag}>Proces</div>
            <h2 className={styles.h2}>Jak dzialamy?</h2>
            <p className={styles.lead}>
              Trzy kroki dziela Cie od odzyskania odszkodowania. Reszta zajmuja
              sie nasi prawnicy.
            </p>
          </div>
        </RevealWrapper>

        <div className={styles.steps}>
          {STEPS.map((step, index) => (
            <RevealWrapper key={step.num} delay={index * 0.07}>
              <article className={styles.step}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <div className={styles.stepNum}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </article>
            </RevealWrapper>
          ))}
        </div>

        <RevealWrapper delay={0.2}>
          <div className={styles.cta}>
            <Link href="#checker" className={styles.ctaBtn}>
              Rozpocznij bezplatnie
              <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="14" height="14">
                <path
                  d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </RevealWrapper>
      </div>
    </section>
  )
}
