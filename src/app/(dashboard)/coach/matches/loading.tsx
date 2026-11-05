// src/app/(dashboard)/coach/matches/loading.tsx
import {
  Skeleton,
  MatchCardSkeleton,
  DataTableSkeleton,
} from "@/components/Skeleton";

export default function CoachMatchesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-44 rounded-xl mb-1.5" />
          <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18202c] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Mobile Match Cards Grid (md:hidden) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {[...Array(4)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>

      {/* Desktop View: Full Data Table (hidden md:block) */}
      <div className="hidden md:block">
        <DataTableSkeleton rows={5} cols={6} />
      </div>
    </div>
  );
}
