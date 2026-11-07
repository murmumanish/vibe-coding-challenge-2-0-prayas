// src/app/(dashboard)/scout/loading.tsx
import { Skeleton, DataTableSkeleton } from "@/components/Skeleton";

export default function ScoutLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#ADD8E6]/60 dark:bg-[#18202c] border border-blue-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <Skeleton className="h-6 w-44 rounded-full mb-3 bg-white/70 dark:bg-slate-800" />
        <Skeleton className="h-8 sm:h-10 w-64 max-w-md rounded-xl mb-3 bg-white/80 dark:bg-slate-800" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg bg-white/60 dark:bg-slate-800" />
        <Skeleton className="h-4 w-3/4 max-w-lg rounded-lg mt-2 bg-white/60 dark:bg-slate-800" />
      </div>

      {/* Filter Bar Skeleton (Search input only) */}
      <div className="bg-white dark:bg-[#18202c] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Roster Table Card Skeleton */}
      <DataTableSkeleton rows={6} cols={5} />
    </div>
  );
}
