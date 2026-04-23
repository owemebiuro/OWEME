import type { Metadata } from "next";

import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Raporty | OWEME CRM",
};

function AppUserMissingState({ email }: { email: string | undefined }) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-700">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Brak użytkownika aplikacyjnego
        </h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          Sesja Supabase jest aktywna{email ? ` dla ${email}` : ""}, ale nie ma
          jeszcze powiązanego rekordu użytkownika CRM.
        </p>
      </div>
    </main>
  );
}

export default async function ReportsPage() {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <ReportsDashboard currentUser={currentUser.appUser} />
      </div>
    </main>
  );
}
