"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MonthNavigator } from "./MonthNavigator";
import {
  getCurrentISTMonth,
  formatMonthName,
  isValidMonthFormat,
  isFutureMonth,
} from "@/lib/monthUtils";
import { AlertCircle, RefreshCw, Loader2, Inbox } from "lucide-react";

export interface SportOption {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface HistoryListProps<T> {
  itemType: "session" | "match";
  title: string;
  subtitle: string;
  sports: SportOption[];
  initialItems: T[];
  headerAction?: React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
  renderEmptyAction?: React.ReactNode;
}

export function HistoryList<T extends { _id: string }>({
  itemType,
  title,
  subtitle,
  sports,
  initialItems,
  headerAction,
  renderItem,
  renderEmptyAction,
}: HistoryListProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentISTMonth = getCurrentISTMonth();

  // Read month and sport from URL search params
  const rawMonthParam = searchParams.get("month");
  const rawSportParam = searchParams.get("sport") || "";

  // Validate month; fallback to current IST month if missing, invalid, or future
  const selectedMonth =
    rawMonthParam && isValidMonthFormat(rawMonthParam) && !isFutureMonth(rawMonthParam, currentISTMonth)
      ? rawMonthParam
      : currentISTMonth;

  // Selected sport slug or ID
  const selectedSport = rawSportParam;

  // Data state
  const [items, setItems] = useState<T[]>(initialItems);
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({});
  const [minMonth, setMinMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the URL is missing the month param or has a future month, normalize URL on mount
  useEffect(() => {
    if (!rawMonthParam || isFutureMonth(rawMonthParam, currentISTMonth)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", currentISTMonth);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [rawMonthParam, currentISTMonth, pathname, router, searchParams]);

  // Navigate helper to update URL search params
  const updateQuery = useCallback(
    (newMonth: string, newSport: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newMonth) {
        params.set("month", newMonth);
      } else {
        params.delete("month");
      }

      if (newSport) {
        params.set("sport", newSport);
      } else {
        params.delete("sport");
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // 1. Fetch available months & counts for this sport
  const fetchMonthCounts = useCallback(async () => {
    try {
      const endpoint = itemType === "session" ? "/api/sessions/months" : "/api/matches/months";
      const q = selectedSport ? `?sport=${encodeURIComponent(selectedSport)}` : "";
      const res = await fetch(`${endpoint}${q}`);
      if (!res.ok) return;

      const data = await res.json();
      const counts: Record<string, number> = {};
      if (Array.isArray(data.months)) {
        for (const item of data.months) {
          counts[item.month] = item.count;
        }
      }
      setMonthCounts(counts);
      setMinMonth(data.earliestMonth || null);
    } catch {
      // Month counts fetch failure is non-fatal
    }
  }, [itemType, selectedSport]);

  // 2. Fetch records for the selected month and sport
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = itemType === "session" ? "/api/sessions" : "/api/matches";
      const params = new URLSearchParams();
      params.set("month", selectedMonth);
      if (selectedSport) {
        params.set("sport", selectedSport);
      }

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch ${itemType}s`);
      }

      const fetchedList: T[] =
        itemType === "session" ? data.sessions || [] : data.matches || [];
      setItems(fetchedList);
    } catch (err: any) {
      setError(err?.message || "Failed to load records. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [itemType, selectedMonth, selectedSport]);

  // Refetch counts whenever sport changes
  useEffect(() => {
    fetchMonthCounts();
  }, [fetchMonthCounts]);

  // Refetch items whenever month or sport changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const monthName = formatMonthName(selectedMonth);
  const typePlural = itemType === "session" ? "sessions" : "matches";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-card-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-foreground opacity-70 mt-0.5">
            {subtitle}
          </p>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* ── Controls Bar: Sport Selector (if > 1 sport) + MonthNavigator ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-card-border shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1">
          {/* If the coach has strictly more than 1 sport, show sport dropdown */}
          {sports.length > 1 && (
            <div className="w-full sm:w-52">
              <select
                value={selectedSport}
                onChange={(e) => updateQuery(selectedMonth, e.target.value)}
                aria-label="Filter by sport"
                className="w-full rounded-xl border border-card-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              >
                <option value="">All Sports ({sports.length})</option>
                {sports.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Navigator Component (stretches end-to-end on mobile, compact on desktop) */}
          <MonthNavigator
            month={selectedMonth}
            onChange={(m) => updateQuery(m, selectedSport)}
            minMonth={minMonth}
            maxMonth={currentISTMonth}
            monthCounts={monthCounts}
          />
        </div>

        {/* Status / Count indicator */}
        <div className="flex items-center justify-end gap-2 text-xs font-semibold text-foreground opacity-70 shrink-0">
          {loading ? (
            <span className="flex items-center gap-1.5 text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Updating...</span>
            </span>
          ) : (
            <span>
              {items.length} {typePlural} in {monthName}
            </span>
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      {error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-6 text-center transition-colors">
          <div className="w-10 h-10 mx-auto rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-red-800 dark:text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={() => fetchItems()}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-card-border text-xs font-bold text-foreground hover:bg-card-hover transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : items.length === 0 && !loading ? (
        <div className="rounded-2xl border border-card-border bg-card p-10 text-center transition-colors">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container text-primary-on-container flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-foreground">
            No {typePlural} in {monthName}
          </p>
          <p className="text-xs text-foreground opacity-60 mt-1 max-w-sm mx-auto">
            There are no recorded {typePlural} for the selected sport and month.
          </p>
          {renderEmptyAction && (
            <div className="mt-4 flex justify-center">{renderEmptyAction}</div>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Subtle loading overlay keeping old month visible without layout jump */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-card/40 backdrop-blur-[1px] flex items-start justify-center pt-10 rounded-2xl transition-opacity animate-in fade-in">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-card-border shadow-md text-xs font-bold text-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading {monthName}...</span>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => (
              <React.Fragment key={item._id}>{renderItem(item)}</React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
