// src/app/(dashboard)/coach/loading.tsx
import { Skeleton, StatCardSkeleton } from "@/components/Skeleton";

export default function CoachLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner Skeleton */}
      <div className="rounded-2xl bg-[#ADD8E6]/60 dark:bg-[#18202c] p-6 sm:p-8 shadow-sm relative overflow-hidden border border-blue-200/80 dark:border-slate-800">
        <Skeleton className="h-6 w-52 rounded-full mb-3 bg-white/70 dark:bg-slate-800" />
        <Skeleton className="h-8 sm:h-10 w-72 max-w-md rounded-xl mb-3 bg-white/80 dark:bg-slate-800" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg mb-6 bg-white/60 dark:bg-slate-800" />
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-10 w-44 rounded-xl bg-slate-900/40 dark:bg-slate-800" />
          <Skeleton className="h-10 w-44 rounded-xl bg-white/80 dark:bg-slate-800" />
        </div>
      </div>

      {/* Quick Stats Overview Skeleton (6 cards) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton isAction={true} />
        <StatCardSkeleton isAction={true} />
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
