// src/app/(dashboard)/coach/ready/loading.tsx
import { Skeleton, DataTableSkeleton } from "@/components/Skeleton";

export default function CoachReadyLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-56 rounded-xl" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-96 max-w-full rounded-lg mt-2" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18202c] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Roster Table Skeleton */}
      <DataTableSkeleton rows={6} cols={5} />
    </div>
  );
}
