import { MEDIA_QUOTES } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './MediaQuotes.module.css'

export function MediaQuotes() {
  return (
    <section className={styles.section} aria-label="Media o oweme">
      <div className={styles.inner}>
        <div className={styles.grid}>
          {MEDIA_QUOTES.map((quote, index) => (
            <RevealWrapper key={quote.source} delay={index * 0.07}>
              <article className={styles.card}>
                <span>{quote.source}</span>
                <p>“{quote.quote}”</p>
              </article>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
