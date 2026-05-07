import type { Metadata } from "next";

import { HeroSearch } from "@/components/FlightChecker/Landing/HeroSearch";
import styles from "@/components/FlightChecker/Landing/Landing.module.css";

export const metadata: Metadata = {
  title: "oweme. — Sprawdź odszkodowanie za lot | EC 261/2004",
  description:
    "Sprawdź w 60 sekund czy Twój opóźniony lub odwołany lot kwalifikuje się do odszkodowania. Adwokaci oweme walczą w Twoim imieniu — bez opłat z góry.",
};

export default function ClaimLandingPage() {
  return (
    <main className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.trust}>
          <span className={styles.stars}>★★★★★</span>
          <span>Trustpilot</span>
          <span>Doskonały</span>
          <span>4,9 / 1 284 opinii</span>
        </div>
        <h1 className={styles.headline}>
          Opóźniony lub odwołany lot?
          <span className={styles.headlineEm}>Odzyskaj do 600 €!</span>
        </h1>
        <p className={styles.description}>
          Sprawdź w 60 sekund, czy przysługuje Ci odszkodowanie za zakłócony
          lot. Bez opłat z góry, bez ryzyka i bez prawniczego chaosu.
        </p>
        <HeroSearch />
        <div className={styles.badges} aria-label="Korzyści">
          <span className={styles.badge}>✦ Bezpłatna weryfikacja</span>
          <span className={styles.badge}>⏱ Szybko i bez ryzyka</span>
          <span className={styles.badge}>✓ 87% skuteczności</span>
        </div>
      </div>
    </main>
  );
}
