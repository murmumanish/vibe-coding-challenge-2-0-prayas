// src/app/(dashboard)/coach/loading.tsx
import { Skeleton, StatCardSkeleton } from "@/components/Skeleton";

export default function CoachLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner Skeleton */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#ADD8E6]/60 dark:bg-[#18202c] p-6 sm:p-8 shadow-sm relative overflow-hidden border border-blue-200/80 dark:border-slate-800">
        <Skeleton className="h-6 w-52 rounded-full mb-3 bg-white/70 dark:bg-slate-800" />
        <Skeleton className="h-8 sm:h-10 w-72 max-w-md rounded-xl mb-3 bg-white/80 dark:bg-slate-800" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg mb-6 bg-white/60 dark:bg-slate-800" />
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-10 w-44 rounded-xl bg-slate-900/40 dark:bg-slate-800" />
          <Skeleton className="h-10 w-44 rounded-xl bg-white/80 dark:bg-slate-800" />
        </div>
      </div>

      {/* Assigned Sports Disciplines Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-5 w-48 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-80 max-w-full rounded mt-1.5" />
          </div>
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5"
            >
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1 flex-1 min-w-0">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Overview Skeleton (4 cards) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Primary Modules Grid Skeleton */}
      <div>
        <Skeleton className="h-6 w-44 rounded-lg mb-4" />
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 shadow-xs flex flex-col justify-between h-48"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1.5" />
              </div>
              <Skeleton className="h-4 w-28 mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
