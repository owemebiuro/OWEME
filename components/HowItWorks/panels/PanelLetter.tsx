import styles from "../HowItWorks.module.css";

interface PanelProps {
  className: string;
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5 12 13l8-5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 19 6v5c0 4.4-2.8 8-7 10-4.2-2-7-5.6-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PanelLetter({ className }: PanelProps) {
  return (
    <div className={className} aria-label="Wezwanie do zapłaty">
      <div className={styles.p3Doc}>
        <div className={styles.p3Head}>
          <span className={styles.p3Mail}>
            <MailIcon />
          </span>
          <div>
            <strong>Wezwanie do zapłaty</strong>
            <span>oweme Kancelaria</span>
          </div>
        </div>
        <div className={styles.p3Lines}>
          <span className={styles.p3LineLong} />
          <span className={styles.p3LineMid} />
          <span className={styles.p3LineWide} />
          <span className={styles.p3LineShort} />
        </div>
        <div className={styles.p3Footer}>
          <span>Żądana kwota</span>
          <strong>400 €</strong>
        </div>
        <div className={styles.p3Stamp}>
          <ShieldIcon />
        </div>
      </div>
      <p className={styles.p3Note}>
        Prawnicy prowadzą korespondencję z linią lotniczą i pilnują terminów.
      </p>
      <div className={styles.panelCaption}>Etap pozasądowy — prowizja 25%</div>
    </div>
  );
}
