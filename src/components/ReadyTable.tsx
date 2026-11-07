"use client";

import { useState } from "react";
import {
  SearchIcon,
  InboxIcon,
  MatchIcon,
  SportsIcon,
  TimeIcon,
} from "./Icons";

export interface ReadyPlayerItem {
  player: {
    _id: string;
    name: string;
    age: number;
    sport: {
      _id: string;
      name: string;
      slug: string;
    };
    userId?: {
      email: string;
    };
    isActive: boolean;
  };
  stats: {
    closedTotal: number;
    closedPresent: number;
    attendancePercent: number;
    matchCount: number;
    isReady: boolean;
  };
}

interface ReadyTableProps {
  initialPlayers: ReadyPlayerItem[];
  isScoutView?: boolean;
}

export function ReadyTable({
  initialPlayers,
  isScoutView = true,
}: ReadyTableProps) {
  const [players] = useState<ReadyPlayerItem[]>(initialPlayers);
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.player.name.toLowerCase().includes(q) ||
      (item.player.userId?.email || "").toLowerCase().includes(q) ||
      (item.player.sport?.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar (Only Search Bar, Dropdown Removed) */}
      <div className="bg-card p-3.5 sm:p-4 rounded-2xl border border-card-border shadow-xs transition-colors">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search athletes by name, email, or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Players Table */}
      {filteredPlayers.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card p-12 text-center shadow-xs transition-colors">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-container text-foreground flex items-center justify-center mb-3">
            <InboxIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {isScoutView
              ? "No Players are Ready for Trial Yet"
              : "No players match the criteria"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
            Players automatically appear here once their closed practice session
            attendance reaches <strong>75% or higher</strong> and they have
            recorded scores in at least <strong>2 matches</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* ── Mobile View: Dedicated Athlete Cards (md:hidden) ── */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredPlayers.map(({ player, stats }) => (
              <div
                key={player._id}
                className="rounded-2xl border border-card-border bg-card p-4 shadow-xs transition-colors hover:shadow-sm"
              >
                {/* Header: Athlete Avatar + Name + Age + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-base shadow-sm shrink-0">
                      {player.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-foreground truncate">
                        {player.name}
                      </h4>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {player.age} years old
                      </span>
                    </div>
                  </div>

                  {stats.isReady ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs shrink-0">
                      <SportsIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                      <TimeIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      In Progress
                    </span>
                  )}
                </div>

                {/* Metrics Strip */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary-container text-foreground border border-card-border">
                    {player.sport?.name || "Unassigned"}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {stats.attendancePercent.toFixed(1)}% attendance
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      ({stats.closedPresent}/{stats.closedTotal})
                    </span>
                  </div>
                </div>

                {/* Footer: Matches Played */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Match Experience</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-primary-container text-foreground border border-card-border">
                    <MatchIcon className="w-3 h-3 text-primary" />
                    {stats.matchCount} Matches
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop View: Full Data Table (hidden md:block) ── */}
          <div className="hidden md:block rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-card-border">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Athlete
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Sport
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Closed Attendance
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Matches Played
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Readiness Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-card-border">
                  {filteredPlayers.map(({ player, stats }) => (
                    <tr
                      key={player._id}
                      className="hover:bg-card-hover transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-sm shrink-0 shadow-xs">
                            {player.name.charAt(0)}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-foreground block">
                              {player.name}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {player.age} yrs
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary-container text-foreground border border-card-border">
                          {player.sport?.name || "Unassigned"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {stats.attendancePercent.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ({stats.closedPresent}/{stats.closedTotal} closed)
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-foreground border border-card-border">
                          <MatchIcon className="w-3.5 h-3.5 text-primary" />
                          {stats.matchCount} Matches
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {stats.isReady ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs">
                            <SportsIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Ready for Trial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <TimeIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
