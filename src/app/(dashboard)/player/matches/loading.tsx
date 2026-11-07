// src/app/(dashboard)/player/matches/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function PlayerMatchesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
          <Skeleton className="h-7 w-56 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-96 max-w-full rounded-lg mt-1" />
      </div>

      {/* Month Navigator Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18202c] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full self-start sm:self-auto" />
      </div>

      {/* Match Cards List Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs space-y-3.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <Skeleton className="h-5 w-56 rounded-md" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3.5 w-32 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-xl self-start sm:self-auto" />
            </div>

            <div>
              <Skeleton className="h-3 w-36 rounded mb-2.5" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
