import type { Metadata } from "next";

import { BackupsPanel } from "@/components/admin/BackupsPanel";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Kopie zapasowe | OWEME CRM",
};

export default async function AdminBackupsPage() {
  await requireRole(["ADMIN"]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <BackupsPanel />
      </div>
    </main>
  );
}
