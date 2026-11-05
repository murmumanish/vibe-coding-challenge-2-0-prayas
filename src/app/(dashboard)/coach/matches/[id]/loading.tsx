// src/app/(dashboard)/coach/matches/[id]/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function MatchDetailLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <Skeleton className="h-7 w-64 rounded-xl mb-1.5" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      {/* Match Overview Header Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-6 w-36 rounded-lg" />
              <Skeleton className="h-5 w-8 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-52 rounded-md" />
          </div>
          <Skeleton className="h-8 w-44 rounded-xl" />
        </div>
      </div>

      {/* 2-Column Form & Scores Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Card Skeleton */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs space-y-4 h-fit">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-3 w-56 rounded-md mb-4" />

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>

          <Skeleton className="h-10 w-full rounded-xl mt-2" />
        </div>

        {/* Right Scores List Card Skeleton */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-48 rounded-lg mb-1" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
