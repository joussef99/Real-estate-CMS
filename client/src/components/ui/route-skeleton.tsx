export function RouteSkeleton() {
  return (
    <div className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-12 w-80 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="aspect-16/11 animate-pulse rounded-2xl bg-slate-200" />
              <div className="mt-5 h-6 w-2/3 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-4 h-4 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}