import type { Metadata } from "next";

import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { MyTasksPanel } from "@/components/dashboard/MyTasksPanel";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { requireAuth } from "@/lib/auth-helpers";
import { formatCurrency } from "@/lib/claims/format";
import { createTRPCCaller } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "Dashboard | OWEME CRM",
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "użytkowniku";
}

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
          jeszcze powiązanego rekordu w tabeli użytkowników aplikacyjnych CRM.
        </p>
      </div>
    </main>
  );
}

export default async function CrmPage() {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  const trpc = await createTRPCCaller();
  const [stats, myTasks, recentActivity] = await Promise.all([
    trpc.dashboard.stats(),
    trpc.dashboard.myTasks(),
    trpc.dashboard.recentActivity(),
  ]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-7">
        <header className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Witaj, {getFirstName(currentUser.appUser.name)}!
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {dateFormatter.format(new Date())}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Nowe sprawy"
            value={stats.newClaims}
            href="/crm/claims?status=NEW"
            tone="neutral"
          />
          <DashboardMetricCard
            label="Do działania dziś"
            value={stats.actionRequiredToday}
            href="/crm/claims"
            description="Otwarte zadania z terminem do końca dnia."
            tone="blue"
          />
          <DashboardMetricCard
            label="Zaległe"
            value={stats.overdue}
            href="/crm/claims?overdue=1"
            description="Otwarte zadania po terminie."
            tone={stats.overdue ? "red" : "green"}
          />
          <DashboardMetricCard
            label="Moje sprawy"
            value={stats.myClaims}
            href={`/crm/claims?ownerId=${currentUser.appUser.id}`}
            tone="purple"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Do weryfikacji"
            value={stats.awaitingVerification}
            href="/crm/claims?status=AWAITING_VERIFICATION"
            tone="amber"
          />
          <DashboardMetricCard
            label="Etap sądowy"
            value={stats.courtStage}
            href="/crm/claims?court=1"
            tone="purple"
          />
          <DashboardMetricCard
            label="Wartość portfela"
            value={formatCurrency(stats.totalPotentialValue)}
            href="/crm/claims"
            description="Aktywne sprawy bez zamkniętych i odrzuconych."
            tone="green"
          />
          <DashboardMetricCard
            label="Zamknięte w miesiącu"
            value={stats.closedThisMonth}
            href="/crm/reports"
            description={`${stats.wonThisMonth} wygranych w tym miesiącu.`}
            tone="neutral"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <MyTasksPanel tasks={myTasks} />
          <RecentActivityPanel activity={recentActivity} />
        </section>
      </div>
    </main>
  );
}
