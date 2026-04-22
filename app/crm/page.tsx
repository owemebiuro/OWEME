import Link from "next/link";

import { requireAuth } from "@/lib/auth-helpers";
import { createTRPCCaller } from "@/lib/trpc/server";

export default async function CrmPage() {
  await requireAuth();
  const trpc = await createTRPCCaller();
  const healthCheck = await trpc.dashboard.healthCheck();

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">OWEME CRM</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Panel CRM
            </h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold transition hover:border-neutral-950"
          >
            Przejdź do admina
          </Link>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          {[
            { label: "Nowe sprawy", value: "0" },
            { label: "Aktywne zadania", value: "0" },
            { label: "Do weryfikacji", value: "0" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-neutral-500">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-dashed border-neutral-300 bg-white p-6">
          <h2 className="text-lg font-semibold">CRM jest gotowy na moduły</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            To chroniony placeholder pod sprawy, klientów, zadania, dokumenty i
            historię komunikacji.
          </p>
          <p className="mt-4 inline-flex rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            tRPC dashboard.healthCheck: {healthCheck.ok ? "OK" : "Błąd"}
          </p>
        </section>
      </div>
    </main>
  );
}
