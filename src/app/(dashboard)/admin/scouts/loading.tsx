// src/app/(dashboard)/admin/scouts/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function AdminScoutsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
          <Skeleton className="h-7 w-64 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-96 max-w-full rounded-lg mt-1.5" />
      </div>

      {/* Search / Action Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c]">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Scout Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-md" />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <Skeleton className="h-3 w-32 rounded-md" />
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
