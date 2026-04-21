import type { Metadata } from "next";
import { Suspense } from "react";
import FlightChecker from "@/components/FlightChecker";
import PlanesDeco from "@/components/PlanesDeco";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "ClaimAir – Odzyskaj odszkodowanie za lot",
  description:
    "Sprawdź czy przysługuje Ci odszkodowanie za opóźniony lub odwołany lot. Bezpłatna analiza, zero opłat z góry.",
};

const ArrowIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" style={{ width: 14, height: 14 }}>
    <path
      d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Home() {
  return (
    <>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M3 11.5L10 2.5l7 9H13V18H7v-6.5H3z" fill="white" />
            </svg>
          </div>
          <div>
            <div className={styles.logoName}>ClaimAir</div>
            <div className={styles.logoSub}>legaltech</div>
          </div>
        </div>
        <div className={styles.navLinks}>
          <a href="#jak-dziala">Jak działa</a>
          <a href="#oferty">Odszkodowania</a>
          <a href="#">FAQ</a>
          <a href="#checker" className={styles.navCta}>
            Sprawdź lot
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero} id="checker">
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <span className={styles.pulse} />
            Rozporządzenie WE 261/2004
          </div>
          <h1 className={styles.heroH1}>
            Odzyskaj
            <br />
            pieniądze za
            <br />
            <em className={styles.heroH1Em}>opóźniony</em>
            <br />
            lot
          </h1>
          <p className={styles.heroDesc}>
            Sprawdzamy Twoje roszczenie w kilka sekund. Bez opłat z góry —
            wynagrodzenie pobieramy wyłącznie po wygranej.
          </p>
          <div className={styles.heroStats}>
            <div>
              <div className={styles.statNum}>do 600 €</div>
              <div className={styles.statLbl}>na osobę</div>
            </div>
            <div>
              <div className={styles.statNum}>98%</div>
              <div className={styles.statLbl}>skuteczności</div>
            </div>
            <div>
              <div className={styles.statNum}>0 zł</div>
              <div className={styles.statLbl}>z góry</div>
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          <PlanesDeco />
          <Suspense fallback={null}>
            <FlightChecker />
          </Suspense>
        </div>
      </section>

      {/* CARDS */}
      <section className={styles.cardsSection} id="oferty">
        <div className={styles.cardsHeader}>
          <h2 className={styles.cardsHeaderH2}>
            Za co możesz odzyskać pieniądze
          </h2>
          <p className={styles.cardsHeaderP}>
            Na podstawie prawa UE każdy pasażer ma zagwarantowane odszkodowanie.
          </p>
        </div>
        <div className={styles.cardsGrid}>
          <div className={styles.claimCard}>
            <div className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#c96a2a" strokeWidth="1.8" />
                <path d="M12 7v5.5l3 2" stroke="#c96a2a" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.cardAmount}>do 600 €</div>
            <div className={styles.cardTitle}>Opóźnienie lotu</div>
            <div className={styles.cardDesc}>
              Opóźnienie powyżej 3 godzin przy przylocie do miejsca docelowego.
              Przysługuje bez względu na przyczynę ze strony linii.
            </div>
            <a href="/?reason=delay#checker" className={styles.cardBtn}>
              Oferta <ArrowIcon />
            </a>
          </div>

          <div className={styles.claimCard}>
            <div className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3l9 9H16v9H8v-9H3l9-9z"
                  stroke="#c96a2a"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.cardAmount}>do 600 €</div>
            <div className={styles.cardTitle}>Odmowa / overbooking</div>
            <div className={styles.cardDesc}>
              Nie wpuszczono Cię na pokład mimo ważnego biletu — z powodu
              przepełnienia lub innej decyzji przewoźnika.
            </div>
            <a href="/?reason=denied#checker" className={styles.cardBtn}>
              Oferta <ArrowIcon />
            </a>
          </div>

          <div className={styles.claimCard}>
            <div className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="5" y="8" width="14" height="12" rx="2" stroke="#c96a2a" strokeWidth="1.8" />
                <path d="M9 8V7a3 3 0 016 0v1" stroke="#c96a2a" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10 14l2-2 2 2" stroke="#c96a2a" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.cardAmount}>do 1300 €</div>
            <div className={styles.cardTitle}>Zniszczony bagaż</div>
            <div className={styles.cardDesc}>
              Linia lotnicza zgubiła, uszkodziła lub opóźniła dostarczenie
              Twojego bagażu. Rekompensata z Konwencji Montrealskiej.
            </div>
            <a href="/?reason=baggage#checker" className={styles.cardBtn}>
              Oferta <ArrowIcon />
            </a>
          </div>

          <div className={styles.claimCard}>
            <div className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#c96a2a" strokeWidth="1.8" />
                <path
                  d="M8 12h8M12 8l4 4-4 4"
                  stroke="#c96a2a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.cardAmount}>do 600 €</div>
            <div className={styles.cardTitle}>Odwołanie lotu</div>
            <div className={styles.cardDesc}>
              Lot odwołany bez odpowiedniego wyprzedzenia lub bez zaproponowania
              rozsądnej alternatywnej trasy przez przewoźnika.
            </div>
            <a href="/?reason=cancelled#checker" className={styles.cardBtn}>
              Oferta <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.howSection} id="jak-dziala">
        <h2 className={styles.howH2}>Jak to działa</h2>
        <div className={styles.stepsRow}>
          <div className={styles.step}>
            <div className={styles.stepCircle}>1</div>
            <h3 className={styles.stepTitle}>Sprawdź lot</h3>
            <p className={styles.stepDesc}>
              Wpisujesz numer lotu. System natychmiast weryfikuje dane w bazach
              lotniczych i ocenia zasadność roszczenia.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepCircle}>2</div>
            <h3 className={styles.stepTitle}>My działamy</h3>
            <p className={styles.stepDesc}>
              Prawnicy przejmują sprawę i negocjują odszkodowanie z linią
              lotniczą — Ty nie musisz nic robić.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepCircle}>3</div>
            <h3 className={styles.stepTitle}>Odbierasz pieniądze</h3>
            <p className={styles.stepDesc}>
              Przelew trafia prosto na Twoje konto. Wynagrodzenie pobieramy
              tylko po wygranej — zero ryzyka.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className={styles.trustSection}>
        <div className={styles.trustItem}>
          <div className={styles.trustNum}>14 200+</div>
          <div className={styles.trustLbl}>wygranych spraw</div>
        </div>
        <div className={styles.trustItem}>
          <div className={styles.trustNum}>8,7 mln €</div>
          <div className={styles.trustLbl}>odzyskanych środków</div>
        </div>
        <div className={styles.trustItem}>
          <div className={styles.trustNum}>4,9 / 5</div>
          <div className={styles.trustLbl}>ocena klientów</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p className={styles.footerCopy}>
          © 2025 ClaimAir sp. z o.o. · Wszelkie prawa zastrzeżone
        </p>
        <div className={styles.footerLinks}>
          <a href="#">Polityka prywatności</a>
          <a href="#">Regulamin</a>
          <a href="#">Kontakt</a>
        </div>
      </footer>
    </>
  );
}
