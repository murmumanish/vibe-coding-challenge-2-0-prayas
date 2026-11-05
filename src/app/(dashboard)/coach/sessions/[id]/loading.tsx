// src/app/(dashboard)/coach/sessions/[id]/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function SessionDetailLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <Skeleton className="h-7 w-48 rounded-xl mb-1.5" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      {/* Session Overview Banner Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="h-6 w-36 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Progress Bar & Stats Skeleton */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Player Attendance List Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-xl" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
