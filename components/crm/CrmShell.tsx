"use client";

import { useState } from "react";

import { CrmSidebar } from "@/components/crm/CrmSidebar";
import { CrmTopbar } from "@/components/crm/CrmTopbar";
import type { AppUser } from "@/types/auth";
import styles from "./CrmShell.module.css";

type CrmShellProps = {
  user: AppUser | null;
  children: React.ReactNode;
};

export function CrmShell({ user, children }: CrmShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <div className={styles.wallpaper} aria-hidden="true" />

      {sidebarOpen ? (
        <div
          className={styles.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebarFrame} ${
          sidebarOpen ? "" : styles.sidebarClosed
        }`}
      >
        <CrmSidebar user={user} onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className={styles.content}>
        <div className={styles.contentInner}>
          <CrmTopbar
            user={user}
            onMenuToggle={() => setSidebarOpen((value) => !value)}
          />
          <div className={styles.pageContent}>{children}</div>
        </div>
      </div>
    </div>
  );
}
