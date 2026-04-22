import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import styles from "./sukces.module.css";

export const metadata: Metadata = {
  title: "Wniosek przyjęty | OWEME",
  description: "Twój wniosek o odszkodowanie za lot został pomyślnie złożony.",
  robots: { index: false },
};

export default async function SuksesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const claimNumber = params.claimNumber ?? "";

  return (
    <>
      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>
      <main className={styles.main}>
        <div className={styles.iconWrap}>
          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
            <circle cx="24" cy="24" r="22" fill="var(--orange-light)" stroke="var(--orange)" strokeWidth="2" />
            <path d="M14 24l7 7 13-13" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className={styles.title}>Wniosek przyjęty!</h1>

        {claimNumber && (
          <div className={styles.claimNumber}>
            Numer sprawy: <strong>{claimNumber}</strong>
          </div>
        )}

        <p className={styles.desc}>
          Otrzymasz potwierdzenie na podany adres email. Nasz zespół skontaktuje się z
          Tobą w ciągu 1–2 dni roboczych.
        </p>

        {/* NEXT STEPS */}
        <div className={styles.steps}>
          <h2 className={styles.stepsTitle}>Co dalej?</h2>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>Weryfikacja wniosku</div>
                <div className={styles.stepDesc}>
                  Nasz prawnik weryfikuje dane lotu i ocenia szanse na odszkodowanie.
                  Poinformujemy Cię o wynikach emailem.
                </div>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>Podpisanie dokumentów</div>
                <div className={styles.stepDesc}>
                  Wyślemy Ci umowę cesji i niezbędne pełnomocnictwa do podpisania.
                  Możesz to zrobić elektronicznie — bez wychodzenia z domu.
                </div>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>Odbiór odszkodowania</div>
                <div className={styles.stepDesc}>
                  Po uzyskaniu odszkodowania od linii lotniczej przelew trafi prosto
                  na Twoje konto. Pobieramy 30% wyłącznie po wygranej.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.btnPrimary}>
            Wróć na stronę główną
          </Link>
          <Link href="/sprawdz" className={styles.btnSecondary}>
            Sprawdź kolejny lot
          </Link>
        </div>

        <p className={styles.contact}>
          Pytania? Napisz do nas:{" "}
          <a href="mailto:kontakt@oweme.pl">kontakt@oweme.pl</a>
        </p>
      </main>
    </>
  );
}
