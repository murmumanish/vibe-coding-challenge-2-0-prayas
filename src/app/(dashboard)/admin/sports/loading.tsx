// src/app/(dashboard)/admin/sports/loading.tsx
import { Skeleton, DataTableSkeleton } from "@/components/Skeleton";

export default function AdminSportsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton without breadcrumb */}
      <div>
        <Skeleton className="h-7 w-56 rounded-xl mb-1.5" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      {/* Preset Action Header Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-5 w-44 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Sports Catalog Table Skeleton */}
      <DataTableSkeleton rows={6} cols={5} />
    </div>
  );
}
