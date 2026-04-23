import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import FlightChecker from "@/components/FlightChecker";
import PlanesDeco from "@/components/PlanesDeco";
import SiteNav from "@/components/SiteNav";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "OWEME - odszkodowanie za opóźniony lot do 600 EUR",
  description:
    "Sprawdź, czy przysługuje Ci odszkodowanie za opóźniony, odwołany lot lub odmowę wejścia na pokład. OWEME działa bez opłat z góry i pobiera prowizję dopiero po wygranej.",
  openGraph: {
    title: "OWEME - odzyskaj odszkodowanie za opóźniony lot",
    description:
      "Do 600 EUR odszkodowania za problemy z lotem. Bez opłat z góry, 30% success fee, obsługa sprawy po stronie OWEME.",
    type: "website",
  },
};

const faqItems = [
  {
    question: "Kiedy przysługuje odszkodowanie za opóźniony lot?",
    answer:
      "Najczęściej wtedy, gdy samolot dotarł do miejsca docelowego co najmniej 3 godziny po planowanym czasie, a przyczyna leżała po stronie przewoźnika.",
  },
  {
    question: "Ile mogę odzyskać?",
    answer:
      "Kwota zależy głównie od długości trasy i wynosi 250 EUR, 400 EUR albo 600 EUR na pasażera.",
  },
  {
    question: "Czy płacę coś z góry?",
    answer:
      "Nie. Analiza sprawy jest bezpłatna, a wynagrodzenie OWEME pobieramy dopiero po skutecznym odzyskaniu odszkodowania.",
  },
  {
    question: "Co muszę przygotować?",
    answer:
      "Najlepiej numer lotu, datę podróży, potwierdzenie rezerwacji lub kartę pokładową. Jeśli czegoś brakuje, pomożemy to uzupełnić.",
  },
  {
    question: "Czy OWEME kontaktuje się z linią lotniczą za mnie?",
    answer:
      "Tak. Po podpisaniu dokumentów prowadzimy korespondencję z przewoźnikiem i pilnujemy dalszych kroków sprawy.",
  },
  {
    question: "Jak długo trwa odzyskanie odszkodowania?",
    answer:
      "Proste sprawy mogą zakończyć się w kilka tygodni. Jeśli linia odmawia wypłaty lub sprawa wymaga etapu sądowego, proces może potrwać dłużej.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
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

const amountCards = [
  {
    amount: "250 EUR",
    title: "Krótsze trasy",
    description:
      "Dla lotów do 1500 km, jeśli opóźnienie przy przylocie wyniosło co najmniej 3 godziny.",
  },
  {
    amount: "400 EUR",
    title: "Średnie trasy",
    description:
      "Dla lotów wewnątrz UE powyżej 1500 km oraz innych tras od 1500 do 3500 km.",
  },
  {
    amount: "600 EUR",
    title: "Długie trasy",
    description:
      "Dla najdłuższych połączeń powyżej 3500 km, gdy spełnione są warunki rozporządzenia WE 261/2004.",
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>

      <section className={styles.hero} id="checker">
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <span className={styles.pulse} />
            Rozporządzenie WE 261/2004
          </div>
          <h1 className={styles.heroH1}>
            Odzyskaj
            <br />
            odszkodowanie za
            <br />
            <em className={styles.heroH1Em}>opóźniony lot</em>
          </h1>
          <p className={styles.heroDesc}>
            Sprawdź w kilka sekund, czy możesz otrzymać do 600 EUR. OWEME
            prowadzi sprawę za Ciebie - bez opłat z góry i z prowizją dopiero po
            wygranej.
          </p>
          <div className={styles.heroActions}>
            <Link href="/sprawdz" className={styles.primaryCta}>
              Sprawdź swoje odszkodowanie <ArrowIcon />
            </Link>
            <a href="#jak-dziala" className={styles.secondaryCta}>
              Jak działamy
            </a>
          </div>
          <div className={styles.heroStats}>
            <div>
              <div className={styles.statNum}>do 600 EUR</div>
              <div className={styles.statLbl}>na pasażera</div>
            </div>
            <div>
              <div className={styles.statNum}>0%</div>
              <div className={styles.statLbl}>opłat z góry</div>
            </div>
            <div>
              <div className={styles.statNum}>30%</div>
              <div className={styles.statLbl}>success fee</div>
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

      <section className={styles.cardsSection} id="oferty">
        <div className={styles.cardsHeader}>
          <h2 className={styles.cardsHeaderH2}>Ile możesz odzyskać?</h2>
          <p className={styles.cardsHeaderP}>
            Wysokość odszkodowania zależy od długości trasy oraz okoliczności
            lotu.
          </p>
        </div>
        <div className={styles.amountGrid}>
          {amountCards.map((card) => (
            <article key={card.amount} className={styles.claimCard}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#c96a2a"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M8 12h8M12 8v8"
                    stroke="#c96a2a"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className={styles.cardAmount}>{card.amount}</div>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardDesc}>{card.description}</div>
              <Link href="/sprawdz" className={styles.cardBtn}>
                Sprawdź kwotę <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.howSection} id="jak-dziala">
        <h2 className={styles.howH2}>Jak działamy?</h2>
        <div className={styles.stepsRow}>
          <div className={styles.step}>
            <div className={styles.stepCircle}>1</div>
            <h3 className={styles.stepTitle}>Sprawdź</h3>
            <p className={styles.stepDesc}>
              Wpisujesz numer lotu i podstawowe dane. Weryfikujemy, czy sprawa
              może kwalifikować się do odszkodowania.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepCircle}>2</div>
            <h3 className={styles.stepTitle}>Podpisz</h3>
            <p className={styles.stepDesc}>
              Przygotowujemy dokumenty i prowadzimy Cię przez podpisanie cesji
              oraz wymaganych zgód.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepCircle}>3</div>
            <h3 className={styles.stepTitle}>Odbierz</h3>
            <p className={styles.stepDesc}>
              Prowadzimy kontakt z linią lotniczą, a po skutecznej wypłacie
              przekazujemy środki na Twoje konto.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.whySection}>
        <div className={styles.cardsHeader}>
          <h2 className={styles.cardsHeaderH2}>Dlaczego OWEME?</h2>
          <p className={styles.cardsHeaderP}>
            Prosty model rozliczenia i minimum formalności po stronie pasażera.
          </p>
        </div>
        <div className={styles.whyGrid}>
          <article className={styles.whyCard}>
            <span className={styles.whyKicker}>0% z góry</span>
            <h3>Start bez ryzyka</h3>
            <p>Nie pobieramy opłaty za analizę ani rozpoczęcie sprawy.</p>
          </article>
          <article className={styles.whyCard}>
            <span className={styles.whyKicker}>30% success fee</span>
            <h3>Płacisz po wygranej</h3>
            <p>Wynagrodzenie rozliczamy dopiero po odzyskaniu pieniędzy.</p>
          </article>
          <article className={styles.whyCard}>
            <span className={styles.whyKicker}>Obsługa end-to-end</span>
            <h3>Robimy to za Ciebie</h3>
            <p>Dokumenty, korespondencja i pilnowanie terminów są po naszej stronie.</p>
          </article>
        </div>
      </section>

      <section className={styles.trustSection}>
        <div className={styles.trustItem}>
          <div className={styles.trustNum}>250-600 EUR</div>
          <div className={styles.trustLbl}>standardowe kwoty z WE 261/2004</div>
        </div>
        <div className={styles.trustItem}>
          <div className={styles.trustNum}>0 PLN</div>
          <div className={styles.trustLbl}>opłat na start</div>
        </div>
        <div className={styles.trustItem}>
          <div className={styles.trustNum}>1 formularz</div>
          <div className={styles.trustLbl}>żeby zacząć sprawę</div>
        </div>
      </section>

      <section className={styles.faqSection} id="faq">
        <div className={styles.cardsHeader}>
          <h2 className={styles.cardsHeaderH2}>FAQ</h2>
          <p className={styles.cardsHeaderP}>
            Najczęstsze pytania przed zgłoszeniem sprawy.
          </p>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              className={styles.faqItem}
              open={index === 0}
            >
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerCopy}>
          © 2026 OWEME. Odszkodowania lotnicze bez opłat z góry.
        </p>
        <div className={styles.footerLinks}>
          <a href="mailto:kontakt@oweme.pl">kontakt@oweme.pl</a>
          <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
          <Link href="/regulamin">Regulamin</Link>
        </div>
      </footer>
    </>
  );
}
