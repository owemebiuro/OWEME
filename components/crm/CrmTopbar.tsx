"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NotificationBell } from "@/components/crm/NotificationBell";
import { signOut } from "@/lib/actions/auth";
import { initials } from "@/lib/claims/format";
import type { AppUser } from "@/types/auth";
import styles from "./CrmTopbar.module.css";

type CrmTopbarProps = {
  user: AppUser | null;
  onMenuToggle: () => void;
};

const pageTitles: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: (p) => p === "/crm", title: "Dashboard" },
  { match: (p) => p === "/crm/claims/archived", title: "Archiwum spraw" },
  {
    match: (p) => p.startsWith("/crm/claims/") && p !== "/crm/claims",
    title: "Szczegóły sprawy",
  },
  { match: (p) => p === "/crm/claims", title: "Sprawy" },
  { match: (p) => p === "/crm/tasks", title: "Zadania" },
  { match: (p) => p.startsWith("/crm/clients/"), title: "Klient" },
  { match: (p) => p === "/crm/clients", title: "Klienci" },
  { match: (p) => p === "/crm/reports", title: "Raporty" },
  { match: (p) => p === "/crm/analytics", title: "Analityka" },
  { match: (p) => p === "/crm/newsletter", title: "Newsletter" },
  {
    match: (p) => p.startsWith("/crm/admin/blog/editor"),
    title: "Edytor artykułu",
  },
  { match: (p) => p === "/crm/admin/blog", title: "Artykuły" },
  { match: (p) => p.startsWith("/crm/admin/users"), title: "Użytkownicy i role" },
  { match: (p) => p.startsWith("/crm/admin/backups"), title: "Kopie zapasowe" },
  { match: (p) => p.startsWith("/crm/admin/logs"), title: "Logi systemu" },
  { match: (p) => p.startsWith("/crm/admin/settings"), title: "Ustawienia systemu" },
];

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function getPageTitle(pathname: string) {
  return pageTitles.find((item) => item.match(pathname))?.title ?? "OWEME CRM";
}

function firstName(name: string | undefined) {
  return name?.trim().split(/\s+/)[0] || "zespole";
}

function openSearchCommand() {
  window.dispatchEvent(new Event("crm-search-open"));
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="h-3.5 w-3.5">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserMenu({ user }: { user: AppUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.userMenu}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={styles.userButton}
      >
        <span className={styles.avatar}>{initials(user.name)}</span>
        <span className={styles.userName}>{user.name.split(" ")[0]}</span>
        <ChevronDownIcon />
      </button>

      {open ? (
        <>
          <div
            className={styles.menuBackdrop}
            onClick={() => setOpen(false)}
          />
          <div className={styles.dropdown}>
            <div className={styles.dropdownHead}>
              <p className={styles.dropdownName}>{user.name}</p>
              <p className={styles.dropdownEmail}>{user.email}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className={styles.dropdownAction}>
                Wyloguj
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function CrmTopbar({ user, onMenuToggle }: CrmTopbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const formattedDate = dateFormatter.format(new Date());

  return (
    <header className={`${styles.toolbar} toolbar`}>
      <button
        type="button"
        onClick={onMenuToggle}
        className={styles.menuButton}
        aria-label="Menu"
      >
        <HamburgerIcon />
      </button>

      <div className={styles.titleGroup}>
        <p className={styles.title}>{title}</p>
        <p className={styles.greeting}>Witaj, {firstName(user?.name)}</p>
      </div>

      <span className={styles.separator} />
      <span className={styles.date}>{formattedDate}</span>
      <span className={styles.spacer} />

      <button
        type="button"
        className={styles.searchButton}
        onClick={openSearchCommand}
      >
        <SearchIcon />
        <span className={styles.searchText}>Szukaj sprawy, klienta...</span>
        <span className={styles.kbd}>Ctrl K</span>
      </button>

      <NotificationBell />

      <Link href="/formularz?admin=1" className={styles.primaryButton}>
        <PlusIcon />
        <span>Nowa sprawa</span>
      </Link>

      {user ? <UserMenu user={user} /> : null}
    </header>
  );
}
