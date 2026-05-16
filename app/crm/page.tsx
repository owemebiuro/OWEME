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

function AppUserMissingState({ email }: { email: string | undefined }) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] p-6">
        <p className="text-sm font-semibold text-[var(--ember-lo)]">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Brak użytkownika aplikacyjnego
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ember-lo)]">
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
  const serializedRecentActivity = recentActivity.map((event) => ({
    ...event,
    createdAt: event.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-4 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <DashboardMetricCard
            label="Nowe sprawy"
            value={stats.newClaims}
            href="/crm/claims?status=NEW"
            description="wpłynęły do obsługi"
            tone="amber"
          />
          <DashboardMetricCard
            label="Moje sprawy"
            value={stats.myClaims}
            href={`/crm/claims?ownerId=${currentUser.appUser.id}`}
            description="aktywne w portfelu"
          />
          <DashboardMetricCard
            label="Etap sądowy"
            value={stats.courtStage}
            href="/crm/claims?court=1"
            description="spraw w toku"
            tone="purple"
          />
          <DashboardMetricCard
            label="Wartość portfela"
            value={formatCurrency(stats.totalPotentialValue)}
            href="/crm/claims"
            description="aktywne roszczenia"
            tone="green"
          />
          <DashboardMetricCard
            label="Zamknięte / mies."
            value={stats.closedThisMonth}
            href="/crm/reports"
            description={`${stats.wonThisMonth} wygranych`}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Do działania dziś"
            value={stats.actionRequiredToday}
            href="/crm/claims"
            description="zadania z terminem"
            variant="pipeline"
          />
          <DashboardMetricCard
            label="Zaległe"
            value={stats.overdue}
            href="/crm/claims?overdue=1"
            description="po terminie"
            tone={stats.overdue ? "red" : "green"}
            variant="pipeline"
          />
          <DashboardMetricCard
            label="Do weryfikacji"
            value={stats.awaitingVerification}
            href="/crm/do-analizy"
            description="czekają na decyzję"
            tone="amber"
            variant="pipeline"
          />
          <DashboardMetricCard
            label="Etap sądowy"
            value={stats.courtStage}
            href="/crm/claims?court=1"
            description="obsługa prawna"
            tone="green"
            variant="pipeline"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
          <MyTasksPanel tasks={myTasks} />
          <RecentActivityPanel activity={serializedRecentActivity} />
        </section>
      </div>
    </main>
  );
}
