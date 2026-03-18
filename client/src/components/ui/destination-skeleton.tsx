import { ProjectCardSkeleton } from './project-card-skeleton';

export function DestinationSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-lg">
      <div className="mb-12 grid gap-12 lg:grid-cols-3">
        {/* Image column */}
        <div className="relative lg:col-span-1">
          <div className="h-full min-h-80 animate-pulse bg-slate-200 lg:min-h-135" />
        </div>

        {/* Content column */}
        <div className="p-8 lg:col-span-2 lg:p-10 space-y-6">
          <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
          <div className="h-10 w-48 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
