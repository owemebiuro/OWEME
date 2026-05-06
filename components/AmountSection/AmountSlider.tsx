'use client'
import { useState } from 'react'
import { SLIDER_DATA } from '@/lib/constants'
import styles from './AmountSection.module.css'

export function AmountSlider() {
  const [idx, setIdx] = useState(1)
  const current = SLIDER_DATA[idx]

  return (
    <div className={styles.sliderWrap}>
      <div className={styles.sliderAmount}>{current.value}</div>
      <div className={styles.sliderTitle}>{current.title}</div>
      <div className={styles.sliderSub}>{current.sub}</div>

      <div className={styles.sliderControl}>
        <div className={styles.sliderLabels}>
          {SLIDER_DATA.map((d, i) => (
            <span
              key={d.value}
              className={[styles.sliderLabel, i === idx ? styles.sliderLabelActive : ''].join(' ')}
            >
              {d.value}
            </span>
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className={styles.range}
          aria-label="Kwota odszkodowania"
          aria-valuetext={current.value}
        />
      </div>
    </div>
  )
}
