"use client";

import { useState } from "react";

import { CrmSidebar } from "@/components/crm/CrmSidebar";
import { CrmTopbar } from "@/components/crm/CrmTopbar";
import type { AppUser } from "@/types/auth";

type CrmShellProps = {
  user: AppUser | null;
  children: React.ReactNode;
};

export function CrmShell({ user, children }: CrmShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed, full height */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[220px] transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <CrmSidebar user={user} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Content — offset by sidebar on desktop */}
      <div className="lg:pl-[220px]">
        <CrmTopbar
          user={user}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        {children}
      </div>
    </div>
  );
}
