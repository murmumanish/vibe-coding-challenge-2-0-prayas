// src/app/(dashboard)/coach/sports/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function CoachSportsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <Skeleton className="h-7 w-40 rounded-xl mb-1.5" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      {/* Add New Sport Card Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs">
        <div className="mb-4">
          <Skeleton className="h-5 w-32 rounded-lg mb-1" />
          <Skeleton className="h-3 w-80 max-w-full rounded-md" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>

      {/* Configured Sports List Card Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-48 rounded-lg mb-1" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
