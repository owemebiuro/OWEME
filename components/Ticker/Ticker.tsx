import { TICKER_ITEMS } from '@/lib/constants'
import styles from './Ticker.module.css'

function TickerItems() {
  return (
    <>
      {TICKER_ITEMS.map((item) => (
        <span key={item} className={styles.item}>
          {item}
        </span>
      ))}
    </>
  )
}

export function Ticker() {
  return (
    <div className={styles.ticker} aria-hidden="true">
      <div className={styles.inner}>
        <TickerItems />
        <TickerItems />
      </div>
    </div>
  )
}
