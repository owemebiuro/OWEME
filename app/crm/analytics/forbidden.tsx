export default function AnalyticsForbidden() {
  return (
    <main className="min-h-screen px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[18px] border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur-xl">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-400">
          403
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Brak dostępu</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Zakładka Analityka jest dostępna tylko dla użytkowników z
          uprawnieniem raportów operacyjnych.
        </p>
      </div>
    </main>
  );
}
