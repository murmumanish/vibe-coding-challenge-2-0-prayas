// src/app/(dashboard)/player/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function PlayerLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Athlete Profile Hero Banner Skeleton */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#ADD8E6]/60 dark:bg-[#18202c] border border-blue-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Top Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <Skeleton className="h-6 w-52 rounded-full bg-white/70 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full bg-white/70 dark:bg-slate-800" />
              <Skeleton className="h-6 w-24 rounded-full bg-white/70 dark:bg-slate-800" />
            </div>
          </div>

          {/* Athlete Identity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 dark:bg-slate-800 shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 rounded-xl bg-white/90 dark:bg-slate-800" />
                <Skeleton className="h-4 w-56 rounded-lg bg-white/70 dark:bg-slate-800" />
              </div>
            </div>
            <Skeleton className="h-10 w-48 rounded-2xl bg-white/80 dark:bg-slate-800" />
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-44"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-9 w-20 rounded-xl mb-2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-3 w-40 mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
