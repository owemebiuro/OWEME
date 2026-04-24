import type { Metadata } from "next";

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { requireAuth } from "@/lib/auth-helpers";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions";

export const metadata: Metadata = {
  title: "Analityka | OWEME CRM",
};

export default async function AnalyticsPage() {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return null;
  }

  if (!hasRolePermission(currentUser.appUser.role, PERMISSIONS.REPORT_OPERATIONAL)) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-800">Brak dostępu</h1>
          <p className="mt-2 text-sm text-amber-700">
            Analityka jest dostępna wyłącznie dla ról ADMIN i READ_ONLY.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <AnalyticsDashboard />
      </div>
    </main>
  );
}
