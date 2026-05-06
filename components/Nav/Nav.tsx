'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './Nav.module.css'

const LINKS = [
  { href: '#uslugi', label: 'Usługi' },
  { href: '#jak-dziala', label: 'Jak działamy' },
  { href: '#prawnicy', label: 'Prawnicy' },
  { href: '#opinie', label: 'Opinie' },
  { href: '#faq', label: 'FAQ' },
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

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.9v3a2 2 0 01-2.2 2A19.8 19.8 0 013 5.2 2 2 0 015 3h3a2 2 0 012 1.7c.1.9.3 1.7.6 2.5a2 2 0 01-.5 2.1L8.8 10.6a16 16 0 004.6 4.6l1.3-1.3a2 2 0 012.1-.5c.8.3 1.6.5 2.5.6A2 2 0 0122 16.9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          <Link href="tel:+48221234567" className={styles.cta} onClick={closeMenu}>
            <PhoneIcon />
            Połącz się z doradcą
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
