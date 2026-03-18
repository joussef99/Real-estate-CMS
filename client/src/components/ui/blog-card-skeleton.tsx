export function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg">
      <div className="aspect-16/10 animate-pulse bg-slate-200" />
      <div className="p-8 space-y-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-6 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-6 w-4/5 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
