"use client";

import { tierFromSlider } from "./airportData";
import styles from "./AmountChecker.module.css";

interface DistanceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function PlaneBadgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.2 2.8c.45.45.35 1.35-.22 1.92l-3.56 3.56 1.24 6.54-1.32 1.32-2.9-5.16-3.2 3.2.3 2.12-1.02 1.02-1.04-2.62-2.62-1.04 1.02-1.02 2.12.3 3.2-3.2-5.16-2.9 1.32-1.32 6.54 1.24 3.56-3.56c.57-.57 1.47-.67 1.92-.22Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DistanceSlider({ value, onChange }: DistanceSliderProps) {
  const tier = tierFromSlider(value);
  const activeIndex = value <= 33 ? 0 : value <= 67 ? 1 : 2;
  const ariaText = `${tier.label} - ${tier.amt} euro`;

  return (
    <div>
      <div className={styles.sliderWrap}>
        <div className={styles.sliderTrackBg}>
          <div className={styles.sliderTrackFill} style={{ width: `${value}%` }} />
        </div>
        <div className={styles.sliderTicksOverlay} aria-hidden="true">
          {Array.from({ length: 41 }, (_, index) => (
            <span
              key={index}
              className={`${styles.stk} ${
                index === 0 || index === 13 || index === 27 || index === 40
                  ? styles.major
                  : ""
              }`}
            />
          ))}
        </div>
        <div
          className={styles.sliderThumbPlane}
          style={{ left: `${value}%` }}
          aria-hidden="true"
        >
          <PlaneBadgeIcon />
        </div>
        <input
          className={styles.rangeInput}
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          aria-label="Dystans lotu"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={ariaText}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <div className={styles.sliderLabels}>
        <span className={`${styles.slLbl} ${activeIndex === 0 ? styles.active : ""}`}>
          1 500 KM
        </span>
        <span className={`${styles.slLbl} ${activeIndex === 1 ? styles.active : ""}`}>
          3 500 KM
        </span>
        <span className={`${styles.slLbl} ${activeIndex === 2 ? styles.active : ""}`}>
          WIĘCEJ
        </span>
      </div>
    </div>
  );
}
