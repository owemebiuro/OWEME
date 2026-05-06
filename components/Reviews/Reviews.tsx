import { RATING_BADGES, REVIEWS } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import { RatingBadge } from './RatingBadge'
import styles from './Reviews.module.css'

function Stars() {
  return <div className={styles.stars} aria-label="5 gwiazdek">★★★★★</div>
}

export function Reviews() {
  return (
    <section className={styles.section} id="opinie" aria-label="Opinie klientów">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <span>Opinie</span>
            <h2>Pasażerowie, którzy nie dali się zbyć liniom</h2>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={0.07}>
          <div className={styles.badges}>
            {RATING_BADGES.map((badge) => (
              <RatingBadge key={badge.source} source={badge.source} score={badge.score} count={badge.count} />
            ))}
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          {REVIEWS.map((review, index) => (
            <RevealWrapper key={review.name} delay={index * 0.07}>
              <article className={styles.card}>
                <div className={styles.amount}>{review.amount}</div>
                <Stars />
                <p className={styles.text} dangerouslySetInnerHTML={{ __html: review.text }} />
                <div className={styles.reviewer}>
                  <div className={styles.avatar}>{review.initials}</div>
                  <div>
                    <div className={styles.name}>{review.name}</div>
                    <div className={styles.meta}>{review.meta}</div>
                  </div>
                </div>
              </article>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
