"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { signOut } from "@/lib/actions/auth";
import { initials } from "@/lib/claims/format";
import type { AppUser } from "@/types/auth";

type CrmTopbarProps = {
  user: AppUser | null;
  onMenuToggle: () => void;
};

const pageTitles: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: (p) => p === "/crm", title: "Dashboard" },
  { match: (p) => p === "/crm/claims/archived", title: "Archiwum spraw" },
  { match: (p) => p.startsWith("/crm/claims/") && p !== "/crm/claims", title: "Szczegóły sprawy" },
  { match: (p) => p === "/crm/claims", title: "Sprawy" },
  { match: (p) => p.startsWith("/crm/clients/"), title: "Klient" },
  { match: (p) => p === "/crm/clients", title: "Klienci" },
  { match: (p) => p === "/crm/reports", title: "Raporty" },
  { match: (p) => p === "/crm/analytics", title: "Analityka" },
  { match: (p) => p === "/crm/newsletter", title: "Newsletter" },
  { match: (p) => p.startsWith("/crm/admin/blog/editor"), title: "Edytor artykułu" },
  { match: (p) => p === "/crm/admin/blog", title: "Artykuły" },
  { match: (p) => p.startsWith("/crm/admin/users"), title: "Użytkownicy i role" },
  { match: (p) => p.startsWith("/crm/admin/backups"), title: "Kopie zapasowe" },
  { match: (p) => p.startsWith("/crm/admin/logs"), title: "Logi systemu" },
  { match: (p) => p.startsWith("/crm/admin/settings"), title: "Ustawienia systemu" },
];

function getPageTitle(pathname: string) {
  return pageTitles.find((t) => t.match(pathname))?.title ?? "OWEME CRM";
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function UserMenu({ user }: { user: AppUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-neutral-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden font-semibold text-neutral-800 sm:block">{user.name.split(" ")[0]}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
            <div className="border-b border-neutral-100 px-4 py-2">
              <p className="text-sm font-semibold text-neutral-950">{user.name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{user.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
              >
                Wyloguj
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export function CrmTopbar({ user, onMenuToggle }: CrmTopbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-md p-1.5 text-neutral-600 transition hover:bg-neutral-100 lg:hidden"
          aria-label="Menu"
        >
          <HamburgerIcon />
        </button>
        <h1 className="text-[15px] font-semibold text-neutral-950">{title}</h1>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="relative rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          aria-label="Powiadomienia"
        >
          <BellIcon />
        </button>

        {user ? (
          <UserMenu user={user} />
        ) : (
          <div className="h-7 w-7 rounded-full bg-neutral-200" />
        )}
      </div>
    </header>
  );
}
