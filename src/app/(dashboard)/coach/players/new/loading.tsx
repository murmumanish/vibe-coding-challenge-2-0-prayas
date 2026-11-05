// src/app/(dashboard)/coach/players/new/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function NewPlayerLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
      {/* Breadcrumb & Title Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-7 w-48 rounded-xl mb-1.5" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      {/* Form Card Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="pt-2">
          <Skeleton className="h-5 w-56 rounded-md mb-2" />
          <Skeleton className="h-3 w-80 rounded-md" />
        </div>

        <div className="pt-4 flex justify-end">
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
