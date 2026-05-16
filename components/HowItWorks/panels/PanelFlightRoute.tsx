import styles from "../HowItWorks.module.css";

interface PanelProps {
  className: string;
}

const ROUTE_PATH = "M 30 120 Q 170 20 310 100";
const ROUTE_LENGTH = 298.84;
const ROUTE_PLANE_COVER = 10;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function PanelFlightRoute({ className }: PanelProps) {
  const reduced = prefersReducedMotion();

  return (
    <div className={className} aria-label="Animowana trasa WAW do LHR">
      <svg className={styles.p1Svg} viewBox="0 0 340 160" role="img">
        <title>Trasa lotu Warszawa - Londyn</title>
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="var(--line)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="var(--ember)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={ROUTE_LENGTH}
          strokeDashoffset={reduced ? ROUTE_PLANE_COVER : ROUTE_LENGTH}
        >
          {!reduced ? (
            <animate
              attributeName="stroke-dashoffset"
              from={ROUTE_LENGTH}
              to={ROUTE_PLANE_COVER}
              dur="2.5s"
              repeatCount="indefinite"
            />
          ) : null}
        </path>
        <circle cx="30" cy="120" r="10" className={styles.p1StartGlow} />
        <circle cx="30" cy="120" r="6" fill="var(--ember)" />
        <circle cx="310" cy="100" r="10" className={styles.p1EndGlow} />
        <circle cx="310" cy="100" r="6" fill="var(--ink)" />
        <path id="motionPath" d={ROUTE_PATH} fill="none" />
        <g transform={reduced ? "translate(310 100)" : undefined}>
          {!reduced ? (
            <animateMotion dur="2.5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#motionPath" />
            </animateMotion>
          ) : null}
          <circle r="10" fill="var(--card)" className={styles.p1PlaneBg} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fill="var(--ink)"
          >
            ✈
          </text>
        </g>
      </svg>

      <div className={styles.p1Airports}>
        <div className={styles.p1Airport}>
          <div className={styles.p1Code}>WAW</div>
          <div className={styles.p1City}>Warszawa</div>
        </div>
        <div className={styles.p1Airport}>
          <div className={styles.p1Code}>LHR</div>
          <div className={styles.p1City}>Londyn</div>
        </div>
      </div>
      <div className={styles.p1Badge}>
        Dystans: <strong>1 447 km</strong> · Próg: <strong>do 250 €</strong>
      </div>
      <div className={styles.panelCaption}>Weryfikacja trasy i dystansu</div>
    </div>
  );
}
