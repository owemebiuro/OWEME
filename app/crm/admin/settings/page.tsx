import type { Metadata } from "next";

import { SystemSettings } from "@/components/admin/SystemSettings";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Ustawienia systemu | OWEME CRM",
};

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN"]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <SystemSettings />
      </div>
    </main>
  );
}
