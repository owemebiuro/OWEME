import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import SiteNav from "@/components/SiteNav";
import styles from "@/app/landing.module.css";

type SuccessSearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Wniosek przyjęty | OWEME",
  description:
    "Potwierdzenie przyjęcia wniosku o odszkodowanie lotnicze w OWEME.",
};

function readParam(params: Awaited<SuccessSearchParams>, key: string) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SuccessSearchParams;
}) {
  const params = await searchParams;
  const claimNumber = readParam(params, "claimNumber") ?? "OWEME";

  return (
    <>
      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>

      <main className={styles.successPage}>
        <section className={styles.successPanel}>
          <div className={styles.successMark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.2 4.2L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className={styles.heroBadge}>
            <span className={styles.pulse} />
            Wniosek zapisany
          </div>

          <h1>Wniosek {claimNumber} został przyjęty!</h1>
          <p>
            Dziękujemy. Zespół OWEME przeanalizuje dane i skontaktuje się z Tobą
            w sprawie kolejnych kroków.
          </p>

          <div className={styles.successSteps}>
            <article>
              <span>1</span>
              <h2>Skontaktujemy się</h2>
              <p>Potwierdzimy dane kontaktowe oraz najważniejsze informacje o locie.</p>
            </article>
            <article>
              <span>2</span>
              <h2>Wyślemy dokumenty</h2>
              <p>Przygotujemy dokumenty potrzebne do prowadzenia sprawy.</p>
            </article>
            <article>
              <span>3</span>
              <h2>Poczekaj na instrukcje</h2>
              <p>Po podpisaniu dokumentów przejmiemy kontakt z linią lotniczą.</p>
            </article>
          </div>

          <div className={styles.successActions}>
            <Link href="/" className={styles.applicationSecondaryButton}>
              Wróć na stronę główną
            </Link>
            <Link href="/sprawdz" className={styles.funnelButton}>
              Sprawdź kolejny lot
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
