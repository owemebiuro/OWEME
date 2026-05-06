import { SERVICES } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './Services.module.css'

function ServiceIcon({ icon }: { icon: (typeof SERVICES)[number]['icon'] }) {
  const common = { width: 21, height: 21, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const

  if (icon === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (icon === 'x-circle') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (icon === 'person-minus') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 19c.7-3.3 2.6-5 5.5-5s4.8 1.7 5.5 5M16 10h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (icon === 'rotate') {
    return (
      <svg {...common}>
        <path d="M4 9a7 7 0 0112-4l2 2M20 15a7 7 0 01-12 4l-2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (icon === 'card') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 10h7M7 14h4M16 13h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Services() {
  return (
    <section className={styles.section} id="uslugi">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <span>Powierz nam swoją sprawę</span>
            <h2>Nasze usługi, dzięki którym możesz odzyskać pieniądze</h2>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          {SERVICES.map((service, index) => (
            <RevealWrapper key={service.title} delay={index * 0.07}>
              <article className={styles.card}>
                <span className={styles.icon}>
                  <ServiceIcon icon={service.icon} />
                </span>
                <h3>{service.title}</h3>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </article>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
