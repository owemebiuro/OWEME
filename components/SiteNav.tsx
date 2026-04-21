"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/landing.module.css";

export default function SiteNav() {
  const pathname = usePathname();
  const isWiedza = pathname.startsWith("/wiedza");

  return (
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
        <Link
          href="/wiedza"
          className={isWiedza ? styles.navActive : undefined}
        >
          Wiedza
        </Link>
        <a href="/#jak-dziala">Jak działa</a>
        <a href="/#oferty">Odszkodowania</a>
        <a href="/#faq">FAQ</a>
        <a href="/#checker" className={styles.navCta}>
          Sprawdź lot
        </a>
      </div>
    </nav>
  );
}
