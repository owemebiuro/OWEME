import { TEAM } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './Team.module.css'

export function Team() {
  return (
    <section className={styles.section} id="zespol" aria-label="Nasz zespół">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <div className={styles.tag}>Zespół</div>
            <h2 className={styles.h2}>Twoi prawnicy</h2>
            <p className={styles.lead}>
              Specjalizujemy się wyłącznie w prawie lotniczym. Nie piszemy ogólnych
              pism — prowadzimy każdą sprawę indywidualnie.
            </p>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          {TEAM.map((member, index) => (
            <RevealWrapper key={member.name} delay={index * 0.07}>
              <article className={styles.card}>
                <div className={styles.avatar}>{member.initials}</div>
                <div className={styles.name}>{member.name}</div>
                <div className={styles.role}>{member.role}</div>
                <p className={styles.bio}>{member.bio}</p>
                <div className={styles.tags}>
                  {member.tags.map((tag) => (
                    <span key={tag} className={styles.tag2}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
