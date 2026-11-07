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
import { formatISTDate } from "@/lib/utils";
import { formatEqualScoreParams } from "@/lib/scoreParams";
import {
  MatchIcon,
  StadiumIcon,
  AlertIcon,
} from "./Icons";
import { Loader2 } from "lucide-react";

export interface MatchHistoryItem {
  _id: string;
  dateKey: string;
  opponent: string;
  location?: string;
  sport?: {
    _id: string;
    name: string;
    slug: string;
    scoreFields?: any[];
  };
  myScore?: {
    primaryScore: number;
    stats?: Record<string, unknown>;
  } | null;
}

interface PlayerMatchHistoryProps {
  initialMonth: string;
  initialMatches: MatchHistoryItem[];
  initialMonths?: Array<{ month: string; count: number }>;
  earliestMonth?: string | null;
  sportName?: string;
}

export function PlayerMatchHistory({
  initialMonth,
  initialMatches,
  initialMonths = [],
  earliestMonth = null,
  sportName = "Academy Sport",
}: PlayerMatchHistoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentISTMonth = getCurrentISTMonth();
  const rawMonthParam = searchParams.get("month");

  const selectedMonth =
    rawMonthParam && isValidMonthFormat(rawMonthParam) && !isFutureMonth(rawMonthParam, currentISTMonth)
      ? rawMonthParam
      : initialMonth || currentISTMonth;

  const [matches, setMatches] = useState<MatchHistoryItem[]>(initialMatches);
  const [minMonth, setMinMonth] = useState<string | null>(earliestMonth);
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const m of initialMonths) {
      counts[m.month] = m.count;
    }
    return counts;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize URL if param missing or future
  useEffect(() => {
    if (!rawMonthParam || isFutureMonth(rawMonthParam, currentISTMonth)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", selectedMonth);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [rawMonthParam, currentISTMonth, pathname, router, searchParams, selectedMonth]);

  // Fetch available month counts
  const fetchMonthCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/matches/months");
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
      // Non-fatal
    }
  }, []);

  // Fetch matches for the selected month
  const fetchMatches = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches?month=${encodeURIComponent(month)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load match history");
      }
      setMatches(data.matches || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load match records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches(selectedMonth);
  }, [selectedMonth, fetchMatches]);

  useEffect(() => {
    fetchMonthCounts();
  }, [fetchMonthCounts]);

  function handleMonthChange(newMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const monthName = formatMonthName(selectedMonth);
  const totalCount = matches.length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Match History &amp; Scores
          </h1>
          <p className="text-xs sm:text-sm text-foreground opacity-70 mt-0.5">
            Your official tournament fixtures and verified performance score records.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-card border border-card-border text-xs font-bold text-foreground shadow-xs self-start sm:self-auto">
            <span className="font-black text-foreground">{totalCount}</span>
            <span className="opacity-70">{totalCount === 1 ? "Match Played" : "Matches Played"}</span>
          </div>
        )}
      </div>

      {/* ── Month Navigation Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-card-border shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1">
          <MonthNavigator
            month={selectedMonth}
            onChange={handleMonthChange}
            minMonth={minMonth}
            maxMonth={currentISTMonth}
            monthCounts={monthCounts}
          />
        </div>

        <div className="flex items-center justify-end gap-2 text-xs font-semibold text-foreground opacity-70 shrink-0">
          <span>
            {totalCount} {totalCount === 1 ? "match" : "matches"} in {monthName}
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs sm:text-sm">
          <AlertIcon className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-card-border text-foreground opacity-70">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-xs sm:text-sm font-semibold">Loading match history...</p>
        </div>
      ) : matches.length === 0 ? (
        /* Empty state */
        <div className="p-10 sm:p-14 text-center rounded-2xl border border-card-border bg-card shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container text-primary flex items-center justify-center mb-3">
            <MatchIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            No matches recorded in {monthName}
          </h3>
          <p className="text-xs text-foreground opacity-70 max-w-sm mx-auto mt-1">
            When you participate in academy matches, coaches record your official scores here. Use the month navigator above to check previous months.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const dateStr = formatISTDate(match.dateKey);
            const scoreParams = formatEqualScoreParams(
              match.myScore
                ? {
                    primaryScore: match.myScore.primaryScore,
                    stats: match.myScore.stats,
                    match: { sport: match.sport },
                  }
                : null,
              match.sport?.name || sportName
            );
            const notes = (match.myScore?.stats as { notes?: string })?.notes;

            return (
              <div
                key={match._id}
                className="rounded-2xl border border-card-border bg-card p-4 sm:p-5 shadow-xs transition-colors space-y-3.5"
              >
                {/* Header: Fixture & Date & Sport badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-card-border">
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                      Dumka Academy vs {match.opponent || "Opponent"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-foreground opacity-70">
                      <span>{dateStr}</span>
                      {match.location && (
                        <>
                          <span>&bull;</span>
                          <span className="inline-flex items-center gap-1">
                            <StadiumIcon className="w-3.5 h-3.5 opacity-60" />
                            {match.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-primary-container text-foreground self-start sm:self-auto">
                    {match.sport?.name || sportName}
                  </span>
                </div>

                {/* Score Parameters: All parameters equally represented */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-foreground opacity-60 mb-2">
                    My Performance Score
                  </div>

                  {scoreParams.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {scoreParams.map((p) => (
                        <div
                          key={p.label}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card-hover border border-card-border shadow-2xs text-xs"
                        >
                          <span className="font-semibold text-foreground opacity-70">
                            {p.label} :
                          </span>
                          <span className="font-black text-foreground">
                            {p.value}
                            {p.unit ? ` ${p.unit}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-foreground opacity-60 italic">
                      Score pending coach entry
                    </div>
                  )}
                </div>

                {/* Coach notes if any */}
                {notes && (
                  <div className="pt-2 border-t border-card-border text-xs text-foreground opacity-80 italic">
                    &ldquo;{notes}&rdquo;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
