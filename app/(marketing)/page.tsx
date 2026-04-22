import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import mkt from "./mkt.module.css";

export const metadata: Metadata = {
  title: "Odzyskaj odszkodowanie za opóźniony lot | OWEME",
  description:
    "Sprawdź czy przysługuje Ci odszkodowanie za opóźniony lub odwołany lot. Do 600 EUR na osobę. Bezpłatna analiza, zero opłat z góry — płacisz tylko po wygranej.",
  openGraph: {
    title: "Odzyskaj odszkodowanie za opóźniony lot | OWEME",
    description:
      "Do 600 EUR odszkodowania za opóźniony lub odwołany lot. Sprawdź w 30 sekund. Zero opłat z góry.",
    type: "website",
  },
};

const faqItems = [
  {
    q: "Kiedy przysługuje odszkodowanie za lot?",
    a: "Odszkodowanie należy się, gdy lot opóźnił się o co najmniej 3 godziny przy przylocie do miejsca docelowego, lot został odwołany bez odpowiedniego wyprzedzenia lub odmówiono Ci wejścia na pokład (overbooking). Podstawą prawną jest Rozporządzenie WE 261/2004.",
  },
  {
    q: "Ile mogę otrzymać odszkodowania?",
    a: "Kwota zależy od odległości lotu: 250 EUR na trasy do 1 500 km, 400 EUR na trasy 1 500–3 500 km i 600 EUR na trasy powyżej 3 500 km. Kwota dotyczy każdego pasażera z osobna.",
  },
  {
    q: "Ile czasu mam na zgłoszenie roszczenia?",
    a: "Przepisy różnią się w zależności od kraju. W Polsce roszczenia ze stosunków cywilnoprawnych przedawniają się po 3 latach. Radzimy nie zwlekać — im wcześniej się zgłosisz, tym łatwiej o dowody.",
  },
  {
    q: "Co to jest cesja wierzytelności?",
    a: "Cesja wierzytelności to formalne przekazanie nam prawa do dochodzenia Twojego roszczenia od linii lotniczej. Dzięki temu nie musisz się angażować w żadne negocjacje ani procesy sądowe — robimy to za Ciebie.",
  },
  {
    q: "Jak długo czeka się na odszkodowanie?",
    a: "Większość spraw zamykamy w ciągu 2–4 miesięcy. Jeśli linia lotnicza odmówi polubownego rozwiązania, sprawa trafia do sądu, co może potrwać dłużej — ale to my ponosimy całe ryzyko i koszty procesu.",
  },
  {
    q: "Co jeśli linia odrzuci roszczenie?",
    a: "Nie odpuszczamy. Kierujemy sprawę do sądu i dochodzimy odszkodowania na drodze prawnej. Ponosimy wszystkie koszty postępowania — płacisz tylko procent od wygranej sumy (30% przy ugodzie, 40% po wyroku sądowym).",
  },
  {
    q: "Czy muszę dostarczyć jakieś dokumenty?",
    a: "Tak — potrzebujemy potwierdzenia rezerwacji lub karty pokładowej jako dowodu odbycia podróży. Resztą dokumentacji zajmujemy się sami: piszemy wezwania, gromadzimy dane z baz lotniczych i prowadzimy korespondencję z linią.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

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

      {/* HERO */}
      <section className={mkt.hero} id="hero">
        <div className={mkt.heroInner}>
          <div className={mkt.heroBadge}>
            <span className={mkt.pulse} />
            Rozporządzenie WE 261/2004
          </div>
          <h1 className={mkt.heroH1}>
            Odzyskaj odszkodowanie<br />
            za <em className={mkt.heroH1Em}>opóźniony lot</em>
          </h1>
          <p className={mkt.heroDesc}>
            Sprawdzamy Twoje roszczenie w kilka sekund. Bez opłat z góry —
            wynagrodzenie pobieramy wyłącznie po wygranej.
          </p>
          <div className={mkt.heroActions}>
            <Link href="/sprawdz" className={mkt.heroCta}>
              Sprawdź swoje odszkodowanie
            </Link>
            <Link href="#jak-dziala" className={mkt.heroSecondary}>
              Jak to działa?
            </Link>
          </div>
          <div className={mkt.heroStats}>
            <div>
              <div className={mkt.statNum}>do 600 €</div>
              <div className={mkt.statLbl}>na osobę</div>
            </div>
            <div>
              <div className={mkt.statNum}>98%</div>
              <div className={mkt.statLbl}>skuteczności</div>
            </div>
            <div>
              <div className={mkt.statNum}>0 zł</div>
              <div className={mkt.statLbl}>z góry</div>
            </div>
            <div>
              <div className={mkt.statNum}>14 200+</div>
              <div className={mkt.statLbl}>wygranych spraw</div>
            </div>
          </div>
        </div>
      </section>

      {/* ILE MOŻESZ ODZYSKAĆ */}
      <section className={mkt.amountsSection} id="kwoty">
        <div className={mkt.sectionInner}>
          <div className={mkt.sectionHeader}>
            <h2 className={mkt.sectionH2}>Ile możesz odzyskać?</h2>
            <p className={mkt.sectionDesc}>
              Kwota odszkodowania zależy od długości trasy lotu.
            </p>
          </div>
          <div className={mkt.amountsGrid}>
            <div className={mkt.amountCard}>
              <div className={mkt.amountValue}>250 €</div>
              <div className={mkt.amountLabel}>na osobę</div>
              <div className={mkt.amountRoute}>trasy do 1 500 km</div>
              <div className={mkt.amountExample}>np. Warszawa–Berlin, Kraków–Wiedeń</div>
            </div>
            <div className={`${mkt.amountCard} ${mkt.amountCardFeatured}`}>
              <div className={mkt.amountFeaturedBadge}>Najczęstszy przypadek</div>
              <div className={mkt.amountValue}>400 €</div>
              <div className={mkt.amountLabel}>na osobę</div>
              <div className={mkt.amountRoute}>trasy 1 500–3 500 km</div>
              <div className={mkt.amountExample}>np. Warszawa–Londyn, Wrocław–Barcelona</div>
            </div>
            <div className={mkt.amountCard}>
              <div className={mkt.amountValue}>600 €</div>
              <div className={mkt.amountLabel}>na osobę</div>
              <div className={mkt.amountRoute}>trasy powyżej 3 500 km</div>
              <div className={mkt.amountExample}>np. Warszawa–Nowy Jork, Gdańsk–Dubaj</div>
            </div>
          </div>
          <div className={mkt.amountsCta}>
            <Link href="/sprawdz" className={mkt.heroCta}>
              Sprawdź swój lot
            </Link>
          </div>
        </div>
      </section>

      {/* JAK DZIAŁAMY */}
      <section className={mkt.howSection} id="jak-dziala">
        <div className={mkt.sectionInner}>
          <div className={mkt.sectionHeader}>
            <h2 className={mkt.sectionH2}>Jak działamy?</h2>
            <p className={mkt.sectionDesc}>
              Trzy proste kroki dzielą Cię od odszkodowania.
            </p>
          </div>
          <div className={mkt.stepsRow}>
            <div className={mkt.step}>
              <div className={mkt.stepNum}>1</div>
              <h3 className={mkt.stepTitle}>Sprawdź</h3>
              <p className={mkt.stepDesc}>
                Podaj numer lotu i datę. System natychmiast sprawdza dane
                w bazach lotniczych i ocenia zasadność roszczenia.
              </p>
            </div>
            <div className={mkt.stepConnector} />
            <div className={mkt.step}>
              <div className={mkt.stepNum}>2</div>
              <h3 className={mkt.stepTitle}>Podpisz</h3>
              <p className={mkt.stepDesc}>
                Wypełniasz krótki formularz online. My generujemy umowę cesji
                i całą dokumentację — Ty tylko ją podpisujesz.
              </p>
            </div>
            <div className={mkt.stepConnector} />
            <div className={mkt.step}>
              <div className={mkt.stepNum}>3</div>
              <h3 className={mkt.stepTitle}>Odbierz</h3>
              <p className={mkt.stepDesc}>
                Przelew trafia prosto na Twoje konto. Wynagrodzenie pobieramy
                tylko po wygranej — zero ryzyka z Twojej strony.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DLACZEGO OWEME */}
      <section className={mkt.whySection} id="dlaczego">
        <div className={mkt.sectionInner}>
          <div className={mkt.sectionHeader}>
            <h2 className={mkt.sectionH2}>Dlaczego OWEME?</h2>
            <p className={mkt.sectionDesc}>
              Działamy na Twoją korzyść bez żadnych zobowiązań z góry.
            </p>
          </div>
          <div className={mkt.whyGrid}>
            <div className={mkt.whyCard}>
              <div className={mkt.whyIcon}>
                <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 7v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className={mkt.whyTitle}>0% opłat z góry</div>
              <div className={mkt.whyDesc}>
                Nie pobieramy żadnych zaliczek ani opłat wstępnych. Zaczynamy
                pracować natychmiast po złożeniu wniosku.
              </div>
            </div>
            <div className={mkt.whyCard}>
              <div className={mkt.whyIcon}>
                <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={mkt.whyTitle}>30% success fee</div>
              <div className={mkt.whyDesc}>
                Pobieramy tylko 30% uzyskanego odszkodowania. Jeśli nie
                wygramy, nie płacisz nic — proste zasady, brak niespodzianek.
              </div>
            </div>
            <div className={mkt.whyCard}>
              <div className={mkt.whyIcon}>
                <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div className={mkt.whyTitle}>Obsługujemy wszystko</div>
              <div className={mkt.whyDesc}>
                Piszemy wezwania, negocjujemy z linią, prowadzimy procesy
                sądowe. Ty nie musisz robić absolutnie nic poza złożeniem
                wniosku.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={mkt.faqSection} id="faq">
        <div className={mkt.sectionInner}>
          <div className={mkt.sectionHeader}>
            <h2 className={mkt.sectionH2}>Często zadawane pytania</h2>
          </div>
          <div className={mkt.faqList}>
            {faqItems.map((item, i) => (
              <details key={i} className={mkt.faqItem}>
                <summary className={mkt.faqQuestion}>
                  {item.q}
                  <span className={mkt.faqChevron}>
                    <svg viewBox="0 0 12 12" fill="none" width="14" height="14">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <p className={mkt.faqAnswer}>{item.a}</p>
              </details>
            ))}
          </div>
          <div className={mkt.faqCta}>
            <span>Masz inne pytanie?</span>
            <a href="mailto:kontakt@oweme.pl" className={mkt.faqCtaLink}>
              Napisz do nas
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={mkt.footer}>
        <div className={mkt.footerInner}>
          <div className={mkt.footerBrand}>
            <span className={mkt.footerLogo}>OWEME</span>
            <span className={mkt.footerTagline}>legaltech</span>
          </div>
          <div className={mkt.footerContact}>
            <a href="mailto:kontakt@oweme.pl">kontakt@oweme.pl</a>
            <a href="tel:+48221234567">+48 22 123 45 67</a>
          </div>
          <div className={mkt.footerLinks}>
            <a href="/polityka-prywatnosci">Polityka prywatności</a>
            <a href="/regulamin">Regulamin</a>
            <a href="mailto:kontakt@oweme.pl">Kontakt</a>
          </div>
        </div>
        <p className={mkt.footerCopy}>
          © {new Date().getFullYear()} OWEME sp. z o.o. · Wszelkie prawa zastrzeżone
        </p>
      </footer>
    </>
  );
}
