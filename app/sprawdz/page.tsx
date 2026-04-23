import type { Metadata } from "next";
import { Suspense } from "react";

import { CompensationChecker } from "@/components/checker/CompensationChecker";
import PlanesDeco from "@/components/PlanesDeco";
import SiteNav from "@/components/SiteNav";
import styles from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "Sprawdź odszkodowanie | OWEME",
  description:
    "Sprawdź bez logowania, czy przysługuje Ci odszkodowanie za opóźniony lub odwołany lot.",
};

export default function CheckPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>

      <main className={styles.checkPage}>
        <section className={styles.checkPanel}>
          <div className={styles.checkIntro}>
            <div className={styles.heroBadge}>
              <span className={styles.pulse} />
              Bezpłatna analiza
            </div>
            <h1>Sprawdź swoje odszkodowanie</h1>
            <p>
              Podaj numer i datę lotu. Wstępnie zweryfikujemy dane, pokażemy
              możliwą kwotę i przeprowadzimy Cię do bezpłatnego wniosku.
            </p>
          </div>
          <div className={styles.checkBox}>
            <PlanesDeco />
            <CompensationChecker />
          </div>
        </section>
      </main>
    </>
  );
}
