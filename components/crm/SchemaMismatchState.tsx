type SchemaMismatchStateProps = {
  area: string;
};

export function SchemaMismatchState({ area }: SchemaMismatchStateProps) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] p-6">
        <p className="text-sm font-semibold text-[var(--ember-lo)]">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">Baza wymaga aktualizacji</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ember-lo)]">
          Nie udało się wczytać widoku: {area}. Kod aplikacji używa już pól
          rozliczeń spraw, ale bieżąca baza danych nie ma jeszcze tych kolumn w
          tabeli <code className="rounded bg-[rgba(27,111,212,0.12)] px-1 py-0.5">Claim</code>.
        </p>
        <div className="mt-4 rounded-md border border-[rgba(27,111,212,0.22)] bg-white/70 p-4 text-sm text-[var(--ink)]">
          <p className="font-semibold">Co zrobić dalej</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Zaktualizuj schemat bazy danych Prisma.</li>
            <li>
              Użyj <code className="rounded bg-[rgba(27,111,212,0.12)] px-1 py-0.5">npx prisma db push</code>
              {" "}albo docelowego flow migracji dla tego środowiska.
            </li>
            <li>Zrestartuj lokalny serwer deweloperski.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
