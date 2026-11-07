// src/app/(dashboard)/admin/students/new/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function AdminNewStudentLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
      {/* Title Skeleton */}
      <div>
        <Skeleton className="h-7 w-52 rounded-xl mb-1.5" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      {/* Form Card Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
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

        {/* Student Login Credentials section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
