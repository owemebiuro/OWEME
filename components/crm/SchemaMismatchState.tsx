type SchemaMismatchStateProps = {
  area: string;
};

export function SchemaMismatchState({ area }: SchemaMismatchStateProps) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-700">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">Baza wymaga aktualizacji</h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          Nie udało się wczytać widoku: {area}. Kod aplikacji używa już pól
          rozliczeń spraw, ale bieżąca baza danych nie ma jeszcze tych kolumn w
          tabeli <code className="rounded bg-amber-100 px-1 py-0.5">Claim</code>.
        </p>
        <div className="mt-4 rounded-md border border-amber-200 bg-white/70 p-4 text-sm text-amber-950">
          <p className="font-semibold">Co zrobić dalej</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Zaktualizuj schemat bazy danych Prisma.</li>
            <li>
              Użyj <code className="rounded bg-amber-100 px-1 py-0.5">npx prisma db push</code>
              {" "}albo docelowego flow migracji dla tego środowiska.
            </li>
            <li>Zrestartuj lokalny serwer deweloperski.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
