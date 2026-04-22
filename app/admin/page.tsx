import Link from "next/link";

import { requireRole } from "@/lib/auth-helpers";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-400">OWEME Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Panel administracyjny
            </h1>
          </div>
          <Link
            href="/crm"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Przejdź do CRM
          </Link>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          {[
            { label: "Użytkownicy", value: "5" },
            { label: "Role", value: "5" },
            { label: "Dostęp", value: "ADMIN" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
            >
              <p className="text-sm font-medium text-neutral-400">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-dashed border-white/20 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold">Admin wymaga roli ADMIN</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">
            To chroniony placeholder pod zarządzanie użytkownikami, rolami,
            ustawieniami i audytem aplikacji.
          </p>
        </section>
      </div>
    </main>
  );
}
