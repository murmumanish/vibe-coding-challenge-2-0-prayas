// src/app/(dashboard)/loading.tsx
import { Skeleton, StatCardSkeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 sm:p-8 shadow-xs">
        <Skeleton className="h-6 w-44 rounded-full mb-3" />
        <Skeleton className="h-8 sm:h-10 w-3/4 max-w-md rounded-xl mb-3" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg mb-6" />
        <div className="flex flex-wrap gap-2.5">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Stats Overview Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <div className="space-y-2.5 pt-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
