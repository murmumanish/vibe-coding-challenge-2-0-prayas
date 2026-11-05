// src/app/(dashboard)/coach/players/loading.tsx
import { Skeleton, PlayerCardSkeleton } from "@/components/Skeleton";

export default function CoachPlayersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-32 rounded-xl mb-1.5" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Search & Filters Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#18202c] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Thin Players Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(12)].map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
