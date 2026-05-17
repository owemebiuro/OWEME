import Link from 'next/link'
import styles from './Footer.module.css'

const NAV_COLS = [
  {
    title: 'Serwis',
    links: [
      { href: '/#checker', label: 'Sprawdź odszkodowanie' },
      { href: '/formularz', label: 'Złóż wniosek' },
      { href: '/#jak-dziala', label: 'Jak działamy' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Prawo',
    links: [
      { href: '/twoje-prawa/we-261-2004-przewodnik', label: 'EC 261/2004' },
      { href: '/twoje-prawa/przedawnienie-roszczenia', label: 'Przedawnienie roszczenia' },
      { href: '/twoje-prawa/nadzwyczajne-okolicznosci', label: 'Siła wyższa — kiedy linia ma rację' },
      { href: '/twoje-prawa/odszkodowanie-za-lot-czarterowy', label: 'Lot czarterowy' },
    ],
  },
  {
    title: 'Firma',
    links: [
      { href: '/polityka-prywatnosci', label: 'Polityka prywatności' },
      { href: '/regulamin', label: 'Regulamin' },
      { href: 'mailto:kontakt@oweme.pl', label: 'kontakt@oweme.pl' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              oweme.
            </Link>
            <p className={styles.tagline}>
              Adwokaci i radcowie prawni odzyskujący odszkodowania lotnicze z tytułu
              EC 261/2004. Bez opłat z góry — płacisz tylko jeśli wygramy.
            </p>
            <a href="mailto:kontakt@oweme.pl" className={styles.email}>
              kontakt@oweme.pl
            </a>
          </div>

          {NAV_COLS.map((col) => (
            <div key={col.title} className={styles.col}>
              <div className={styles.colTitle}>{col.title}</div>
              <ul className={styles.colLinks}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.colLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>© {new Date().getFullYear()} oweme. Wszelkie prawa zastrzeżone.</p>
          <p className={styles.legal}>
            Treści mają charakter ogólny i nie stanowią porady prawnej dla konkretnej sprawy.
          </p>
        </div>
      </div>
    </footer>
  )
}
