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
import {
  ClipboardIcon,
  CheckCircleIcon,
  LockIcon,
  AlertIcon,
} from "./Icons";
import { Loader2 } from "lucide-react";

export interface SessionHistoryItem {
  _id: string;
  dateKey: string;
  sport?: {
    _id: string;
    name: string;
    slug: string;
  };
  status: "open" | "closed";
  closedAt?: string;
  myStatus?: "present" | "absent";
  attendanceStats?: {
    total: number;
    present: number;
  };
}

interface PlayerSessionHistoryProps {
  initialMonth: string;
  initialSessions: SessionHistoryItem[];
  initialMonths?: Array<{ month: string; count: number }>;
  earliestMonth?: string | null;
  sportName?: string;
}

export function PlayerSessionHistory({
  initialMonth,
  initialSessions,
  initialMonths = [],
  earliestMonth = null,
  sportName = "Academy Sport",
}: PlayerSessionHistoryProps) {
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

  const [sessions, setSessions] = useState<SessionHistoryItem[]>(initialSessions);
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

  // Normalize URL if param is missing or future
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
      const res = await fetch("/api/sessions/months");
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

  // Fetch sessions for the selected month
  const fetchSessions = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions?month=${encodeURIComponent(month)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load session history");
      }
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load practice sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when month changes
  useEffect(() => {
    fetchSessions(selectedMonth);
  }, [selectedMonth, fetchSessions]);

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
  const attendedCount = sessions.filter((s) => s.myStatus === "present").length;
  const totalCount = sessions.length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Practice Session History
          </h1>
          <p className="text-xs sm:text-sm text-foreground opacity-70 mt-0.5">
            Your official academy attendance logs and session participation records.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-card border border-card-border text-xs font-bold text-foreground shadow-xs self-start sm:self-auto">
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              {attendedCount} Present
            </span>
            <span className="text-foreground opacity-40">&bull;</span>
            <span className="opacity-70">{totalCount} Total Sessions</span>
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
            {totalCount} {totalCount === 1 ? "session" : "sessions"} in {monthName}
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
          <p className="text-xs sm:text-sm font-semibold">Loading practice sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        /* Empty state */
        <div className="p-10 sm:p-14 text-center rounded-2xl border border-card-border bg-card shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container text-primary flex items-center justify-center mb-3">
            <ClipboardIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            No practice sessions in {monthName}
          </h3>
          <p className="text-xs text-foreground opacity-70 max-w-sm mx-auto mt-1">
            There are no recorded attendance sessions for you in this month. Use the month navigator above to check previous months.
          </p>
        </div>
      ) : (
        <>
          {/* ── Mobile View: Dedicated Session Cards (md:hidden) ── */}
          <div className="space-y-3 md:hidden">
            {sessions.map((sess) => {
              const isPresent = sess.myStatus === "present";
              const isClosed = sess.status === "closed";
              const dateStr = formatISTDate(sess.dateKey);

              return (
                <div
                  key={sess._id}
                  className="rounded-2xl border border-card-border bg-card p-4 shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-sm font-bold text-foreground block">
                        {dateStr}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[11px] font-semibold bg-primary-container text-foreground opacity-90">
                        {sess.sport?.name || sportName}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
                        isPresent
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPresent ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {isPresent ? "Present" : "Absent"}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-card-border flex items-center justify-between text-[11px]">
                    <span className="text-foreground opacity-60">Session State</span>
                    <span
                      className={`inline-flex items-center gap-1.5 font-medium ${
                        isClosed
                          ? "text-foreground opacity-70"
                          : "text-emerald-600 dark:text-emerald-400 font-bold"
                      }`}
                    >
                      {isClosed ? (
                        <>
                          <LockIcon className="w-3 h-3 opacity-60" /> Closed &amp; Locked
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open Practice
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop View: Full Table (hidden md:block) ── */}
          <div className="hidden md:block rounded-2xl border border-card-border bg-card shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-card-border">
              <thead className="bg-card-hover">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-foreground opacity-70 uppercase tracking-wider">
                    Session Date
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-foreground opacity-70 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-foreground opacity-70 uppercase tracking-wider">
                    My Attendance
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-foreground opacity-70 uppercase tracking-wider">
                    Session Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-card-border">
                {sessions.map((sess) => {
                  const isPresent = sess.myStatus === "present";
                  const isClosed = sess.status === "closed";
                  const dateStr = formatISTDate(sess.dateKey);

                  return (
                    <tr
                      key={sess._id}
                      className="hover:bg-card-hover transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-foreground block">
                          {dateStr}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary-container text-foreground">
                          {sess.sport?.name || sportName}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isPresent
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPresent ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {isPresent ? "Present" : "Absent"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isClosed
                              ? "bg-card-hover text-foreground opacity-80 border border-card-border"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {isClosed ? (
                            <>
                              <LockIcon className="w-3 h-3 opacity-60" /> Closed &amp; Locked
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open Practice
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
