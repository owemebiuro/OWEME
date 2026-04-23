"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/landing.module.css";

export default function SiteNav() {
  const pathname = usePathname();
  const isWiedza = pathname.startsWith("/wiedza");

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo} aria-label="OWEME - strona główna">
        <Image
          src="/oweme-logo-cropped.png"
          alt="OWEME"
          width={968}
          height={169}
          className={styles.logoImage}
          priority
        />
      </Link>
      <div className={styles.navLinks}>
        <Link
          href="/wiedza"
          className={isWiedza ? styles.navActive : undefined}
        >
          Wiedza
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
