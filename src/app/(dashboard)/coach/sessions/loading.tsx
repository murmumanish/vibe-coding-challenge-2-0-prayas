// src/app/(dashboard)/coach/sessions/loading.tsx
import {
  Skeleton,
  SessionCardSkeleton,
  DataTableSkeleton,
} from "@/components/Skeleton";

export default function CoachSessionsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-48 rounded-xl mb-1.5" />
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

      {/* Mobile Card Grid (md:hidden) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:hidden">
        {[...Array(6)].map((_, i) => (
          <SessionCardSkeleton key={i} />
        ))}
      </div>

      {/* Desktop View: Full Data Table (hidden md:block) */}
      <div className="hidden md:block">
        <DataTableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}
