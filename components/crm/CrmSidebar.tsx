"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { initials } from "@/lib/claims/format";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";
import type { AppUser } from "@/types/auth";
import styles from "./CrmSidebar.module.css";

type CrmSidebarProps = {
  user: AppUser | null;
  onClose?: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: keyof typeof PERMISSIONS;
  soon?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <polyline strokeLinecap="round" strokeLinejoin="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function DocumentChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function UserCogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

const roleLabels = {
  SUPER_ADMIN: "Super Administrator",
  ADMIN: "Administrator",
  EDITOR: "Redaktor",
  OPERATOR: "Operator",
  LAWYER: "Prawnik",
  MARKETING: "Marketing",
  READ_ONLY: "Tylko odczyt",
} as const;

function openSearchCommand() {
  window.dispatchEvent(new Event("crm-search-open"));
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const router = useRouter();

  if (item.soon) {
    return (
      <div className={`${styles.navItem} ${styles.navLinkSoon}`}>
        <span className={styles.navIcon}>{item.icon}</span>
        <span className={styles.navLabel}>{item.label}</span>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider opacity-60">wkrótce</span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      prefetch
      onClick={onClick}
      onFocus={() => router.prefetch(item.href)}
      onPointerEnter={() => router.prefetch(item.href)}
      aria-current={active ? "page" : undefined}
      className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
    >
      <span className={styles.navIcon}>{item.icon}</span>
      <span className={styles.navLabel}>{item.label}</span>
      <NavPendingIndicator />
    </Link>
  );
}

function NavPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`${styles.pendingIndicator} ${
        pending ? styles.pendingIndicatorVisible : ""
      }`}
    />
  );
}

export function CrmSidebar({ user, onClose }: CrmSidebarProps) {
  const pathname = usePathname();

  const role = user?.role;
  const showBlog = role ? hasRolePermission(role, PERMISSIONS.BLOG_MANAGE) : false;
  const showAdminUsers = role ? hasRolePermission(role, PERMISSIONS.ADMIN_USERS) : false;
  const showAnalytics = role ? hasRolePermission(role, PERMISSIONS.REPORT_OPERATIONAL) : false;
  const showReports = role
    ? hasRolePermission(role, PERMISSIONS.REPORT_OPERATIONAL) ||
      hasRolePermission(role, PERMISSIONS.REPORT_SALES) ||
      hasRolePermission(role, PERMISSIONS.REPORT_FINANCIAL)
    : false;
  const showClaims = role ? hasRolePermission(role, PERMISSIONS.CLAIM_READ_ALL) : false;
  const showClients = role ? hasRolePermission(role, PERMISSIONS.CLIENT_READ) : false;

  const navGroups: NavGroup[] = [
    {
      title: "Analityka",
      items: [
        { label: "Dashboard", href: "/crm", icon: <HomeIcon /> },
        ...(showAnalytics
          ? [{ label: "Analityka", href: "/crm/analytics", icon: <ChartIcon /> }]
          : []),
        ...(showReports
          ? [{ label: "Raporty", href: "/crm/reports", icon: <DocumentChartIcon /> }]
          : []),
        ...(showBlog
          ? [{ label: "Blog", href: "/crm/admin/blog", icon: <PencilIcon /> }]
          : []),
      ],
    },
    ...(showClaims || showClients || showBlog
      ? [
          {
            title: "CRM",
            items: [
              ...(showClients
                ? [{ label: "Klienci", href: "/crm/clients", icon: <UsersIcon /> }]
                : []),
              ...(showClaims
                ? [
                    { label: "Leady", href: "/crm/leads", icon: <UsersIcon /> },
                    { label: "Do analizy", href: "/crm/do-analizy", icon: <ListIcon /> },
                    { label: "Sprawy", href: "/crm/claims", icon: <BriefcaseIcon /> },
                    { label: "Zadania", href: "/crm/tasks", icon: <ListIcon /> },
                    { label: "Archiwum", href: "/crm/claims/archived", icon: <ArchiveIcon /> },
                  ]
                : []),
              ...(showBlog
                ? [{ label: "Newsletter", href: "/crm/newsletter", icon: <EnvelopeIcon /> }]
                : []),
            ],
          },
        ]
      : []),
    ...(showAdminUsers
      ? [
          {
            title: "System",
            items: [
              { label: "Użytkownicy i role", href: "/crm/admin/users", icon: <UserCogIcon /> },
              { label: "Kopie zapasowe", href: "/crm/admin/backups", icon: <DatabaseIcon /> },
              { label: "Logi systemu", href: "/crm/admin/logs", icon: <ListIcon /> },
              { label: "Ustawienia systemu", href: "/crm/admin/settings", icon: <CogIcon /> },
            ],
          },
        ]
      : []),
  ];

  function isActive(href: string) {
    if (href === "/crm") return pathname === "/crm";
    if (href === "/crm/claims") {
      return pathname === "/crm/claims" || (pathname.startsWith("/crm/claims/") && !pathname.startsWith("/crm/claims/archived"));
    }
    return pathname.startsWith(href);
  }

  return (
    <div className={`${styles.sidebar} sidebar`}>
      <div className={styles.top}>
        <Link href="/crm" className={styles.logo} onClick={onClose}>
          <span className={styles.logoIcon}>
            <LogoIcon />
          </span>
          <span className={styles.logoText}>
            owe<span>me.</span>
          </span>
        </Link>
        <button
          type="button"
          className={styles.search}
          onClick={openSearchCommand}
        >
          <SearchIcon />
          <span className={styles.searchLabel}>Szukaj...</span>
        </button>
      </div>

      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.title} className={styles.group}>
            <p className={styles.groupTitle}>
              {group.title}
            </p>
            <ul className={styles.navList}>
              {group.items.map((item) => (
                <li key={item.label}>
                  <NavLink
                    item={item}
                    active={isActive(item.href)}
                    onClick={onClose}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <span className={styles.avatar}>
            {user ? initials(user.name) : "OW"}
          </span>
          <span className={styles.userMeta}>
            <span className={styles.userName}>{user?.name ?? "OWEME CRM"}</span>
            <span className={styles.userRole}>
              {user ? roleLabels[user.role] : "System aktywny"}
            </span>
          </span>
          <span className={styles.chevron}>
            <ChevronIcon />
          </span>
        </div>
      </div>
    </div>
  );
}
