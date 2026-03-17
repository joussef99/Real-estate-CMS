export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-lg">
      <div className="aspect-16/11 animate-pulse bg-slate-200" />
      <div className="space-y-5 p-6">
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4">
          <div className="h-5 animate-pulse rounded bg-slate-200" />
          <div className="h-5 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}