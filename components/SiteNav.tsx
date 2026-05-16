"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/landing.module.css";

function PlaneLogo() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 16V8l-8.5 4L4 8v8l8.5-4L21 16z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.5 12v8M8.5 14l4 6 4-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const isWiedza = pathname.startsWith("/wiedza");

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo} aria-label="OWEME - strona główna">
        <span className={styles.logoMark}>
          <PlaneLogo />
        </span>
        <span className={styles.logoText}>
          owe<span>me.</span>
        </span>
      </Link>
      <div className={styles.navLinks}>
        <Link
          href="/wiedza"
          className={isWiedza ? styles.navActive : undefined}
        >
          Twoje prawa
        </Link>
        <Link href="/#jak-dziala">Jak działa</Link>
        <Link href="/#kwoty">Odszkodowania</Link>
        <Link href="/#faq">FAQ</Link>
        <Link href="/sprawdz" className={styles.navCta}>
          Sprawdź lot
        </Link>
      </div>
    </nav>
  );
}
