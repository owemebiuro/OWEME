type CrmRouteSkeletonProps = {
  title?: string;
};

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-neutral-200/80 ${className}`}
    />
  );
}

function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      {children ?? (
        <div className="space-y-3">
          <SkeletonLine className="h-3 w-28" />
          <SkeletonLine className="h-8 w-20" />
          <SkeletonLine className="h-3 w-36" />
        </div>
      )}
    </div>
  );
}

export function CrmListRouteSkeleton({
  title = "Ladowanie widoku CRM",
}: CrmRouteSkeletonProps) {
  return (
    <main
      className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8"
      aria-label={title}
    >
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-9 w-56" />
            <SkeletonLine className="h-4 w-80 max-w-full" />
          </div>
          <SkeletonLine className="h-10 w-40 rounded-md" />
        </header>

        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <SkeletonLine key={index} className="h-3 w-24" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 px-4 py-4">
                <SkeletonLine className="h-4 w-28" />
                <SkeletonLine className="h-4 w-40" />
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-4 w-32" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function CrmDetailRouteSkeleton({
  title = "Ladowanie szczegolow CRM",
}: CrmRouteSkeletonProps) {
  return (
    <main
      className="min-h-screen bg-neutral-50 text-neutral-950"
      aria-label={title}
    >
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-3 w-28" />
            <SkeletonLine className="h-8 w-64" />
          </div>
          <div className="flex gap-2">
            <SkeletonLine className="h-10 w-28 rounded-md" />
            <SkeletonLine className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(260px,0.32fr)_1fr] lg:px-8">
        <aside className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard key={index}>
              <div className="space-y-4">
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-4 w-40" />
                <SkeletonLine className="h-4 w-32" />
                <SkeletonLine className="h-4 w-44" />
              </div>
            </SkeletonCard>
          ))}
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonLine key={index} className="h-9 w-24 rounded-md" />
              ))}
            </div>
          </div>

          <SkeletonCard>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-5 w-48" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </section>
      </div>
    </main>
  );
}
