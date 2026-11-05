// src/components/Skeleton.tsx
// Modern Shimmer Skeleton System for Sports Academy Desk
import React from "react";

/**
 * Base shimmer skeleton element.
 * Uses CSS keyframe shimmer for fluid, accessible loading states.
 */
export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-xl bg-slate-200/75 dark:bg-slate-800/75 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/45 dark:before:via-slate-700/40 before:to-transparent ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton for the quick stat and action cards on Coach Dashboard
 */
export function StatCardSkeleton({
  isAction = false,
}: {
  isAction?: boolean;
} = {}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-5 rounded-lg" />
      </div>
      <Skeleton className={`mt-3 h-8 ${isAction ? "w-24" : "w-12"} rounded-lg`} />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

/**
 * Skeleton for thin player cards on Players page
 */
export function PlayerCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-3 shadow-xs transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full shrink-0" />
        </div>
      </div>
      <Skeleton className="mt-2.5 h-7 w-full rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for thin session cards (Mobile & card view on Sessions page)
 */
export function SessionCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-3 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-14 rounded-full shrink-0" />
        </div>
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-6 w-24 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

/**
 * Skeleton for match cards (Mobile view on Matches page)
 */
export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for desktop data tables (Sessions, Matches, Scout rosters)
 */
export function DataTableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
} = {}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-sm overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <div className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <div className="bg-slate-50/80 dark:bg-slate-800/60 px-6 py-3.5 flex items-center justify-between gap-4">
            {[...Array(cols)].map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-20" />
            ))}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#18202c]">
            {[...Array(rows)].map((_, r) => (
              <div
                key={r}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Hero / Welcome banners across dashboards
 */
export function BannerSkeleton({
  titleWidth = "w-64",
  subtitleWidth = "w-96",
  hasActions = true,
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  hasActions?: boolean;
} = {}) {
  return (
    <div className="rounded-2xl sm:rounded-3xl bg-[#ADD8E6]/60 dark:bg-[#18202c] border border-blue-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative overflow-hidden">
      <Skeleton className="h-6 w-44 rounded-full mb-3 bg-white/70 dark:bg-slate-800" />
      <Skeleton
        className={`h-8 sm:h-10 ${titleWidth} max-w-md rounded-xl mb-3 bg-white/80 dark:bg-slate-800`}
      />
      <Skeleton
        className={`h-4 ${subtitleWidth} max-w-xl rounded-lg mb-4 bg-white/60 dark:bg-slate-800`}
      />
      {hasActions && (
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Skeleton className="h-10 w-36 rounded-xl bg-slate-900/30 dark:bg-slate-800" />
          <Skeleton className="h-10 w-36 rounded-xl bg-white/80 dark:bg-slate-800" />
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton for list & table records
 */
export function ListRowSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-3 shadow-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Player Profile Modal statistics loading
 */
export function ProfileStatsSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-44" />
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
