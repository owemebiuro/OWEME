import styles from './Reviews.module.css'

function GoogleSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.2 3-7.2z" fill="var(--ember)" />
      <path d="M12 22c2.7 0 5-0.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0012 22z" fill="var(--sage)" />
      <path d="M6.4 13.8a6 6 0 010-3.6V7.6H3.1a10 10 0 000 8.8l3.3-2.6z" fill="var(--star)" />
      <path d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0012 2a10 10 0 00-8.9 5.6l3.3 2.6c.8-2.3 3-4.1 5.6-4.1z" fill="var(--ember-hi)" />
    </svg>
  )
}

function FBSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--ink)" />
      <path d="M13.7 18v-5.5h1.8l.3-2.2h-2.1V8.9c0-.6.2-1.1 1.1-1.1h1.1v-2c-.2 0-.9-.1-1.7-.1-1.7 0-2.8 1-2.8 2.9v1.7H9.5v2.2h1.9V18h2.3z" fill="var(--white)" />
    </svg>
  )
}

export function RatingBadge({ source, score, count }: { source: 'Google' | 'Facebook'; score: string; count: string }) {
  return (
    <div className={styles.ratingBadge}>
      {source === 'Google' ? <GoogleSVG /> : <FBSVG />}
      <div>
        <strong>{source}</strong>
        <span className={styles.ratingStars}>★★★★★</span>
      </div>
      <div className={styles.ratingScore}>
        <strong>{score}</strong>
        <span>{count}</span>
      </div>
    </div>
  )
}
