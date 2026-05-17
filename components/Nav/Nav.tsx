'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './Nav.module.css'

const LINKS = [
  { href: '/#checker', label: 'Sprawdź lot' },
  { href: '/#jak-dziala', label: 'Jak to działa' },
  { href: '/#ile-mozesz', label: 'Kwoty' },
  { href: '/#opinie', label: 'Opinie' },
  { href: '/#faq', label: 'FAQ' },
] as const

const RIGHTS_LINKS = [
  { href: '/wiedza/odszkodowanie-za-opozniony-lot', label: 'Odszkodowanie za opóźniony lot' },
  { href: '/wiedza/odszkodowanie-za-odwolany-lot', label: 'Odszkodowanie za odwołany lot' },
  { href: '/wiedza/overbooking', label: 'Overbooking' },
  { href: '/wiedza/strajk-linii-lotniczych', label: 'Strajk linii lotniczych' },
  { href: '/wiedza/odszkodowanie-za-lot-przesiadkowy', label: 'Odszkodowanie za lot przesiadkowy' },
  { href: '/wiedza/odszkodowanie-za-lot-czarterowy', label: 'Odszkodowanie za lot czarterowy' },
  { href: '/wiedza/zwrot-za-lot', label: 'Zwrot za lot' },
  {
    href: '/wiedza/odszkodowanie-za-niewpuszczenie-na-poklad',
    label: 'Odszkodowanie za niewpuszczenie na pokład samolotu',
  },
] as const

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
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className={styles.dropdownChevron} width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

  return (
    <nav className={[styles.nav, scrolled ? styles.scrolled : ''].join(' ')} aria-label="Główna nawigacja">
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          <span className={styles.logoMark}>
            <PlaneLogo />
          </span>
          <span className={styles.logoText}>
            owe<span>me.</span>
          </span>
        </Link>

        <div
          ref={panelRef}
          id="nav-links"
          className={[styles.links, isOpen ? styles.linksOpen : ''].join(' ')}
          onClick={(event) => {
            if (event.target === panelRef.current) closeMenu()
          }}
        >
          {LINKS.slice(0, 3).map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}

          <div className={styles.dropdownWrap}>
            <button type="button" className={styles.dropdownTrigger} aria-haspopup="true">
              Twoje prawa
              <ChevronIcon />
            </button>
            <div className={styles.dropdown} aria-label="Artykuły: Twoje prawa">
              {RIGHTS_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={styles.dropdownItem} onClick={closeMenu}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {LINKS.slice(3).map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          <Link href="/#checker" className={styles.cta} onClick={closeMenu}>
            <CheckIcon />
            Sprawdź odszkodowanie
          </Link>
        </div>

        <button
          className={styles.hamburger}
          type="button"
          aria-label="Menu"
          aria-controls="nav-links"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={[styles.hamburgerLine, isOpen ? styles.lineTop : ''].join(' ')} />
          <span className={[styles.hamburgerLine, isOpen ? styles.lineMid : ''].join(' ')} />
          <span className={[styles.hamburgerLine, isOpen ? styles.lineBot : ''].join(' ')} />
        </button>
      </div>
    </nav>
  )
}
