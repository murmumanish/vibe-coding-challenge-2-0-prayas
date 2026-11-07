// src/app/(dashboard)/player/sessions/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function PlayerSessionsLoading() {
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

      {/* Sessions History List Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full self-start sm:self-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
