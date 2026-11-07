// src/app/(dashboard)/coach/sessions/new/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function NewSessionLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
      {/* Title Skeleton without breadcrumb */}
      <div>
        <Skeleton className="h-7 w-56 rounded-xl mb-1.5" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="pt-4 flex justify-end gap-2">
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
