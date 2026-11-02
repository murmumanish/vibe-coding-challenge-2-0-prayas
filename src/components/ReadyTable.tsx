"use client";

import { useState } from "react";

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
  const [filterSport, setFilterSport] = useState("");

  const sportOptions = Array.from(
    new Set(players.map((p) => p.player?.sport?.name).filter(Boolean))
  );

  const filteredPlayers = players.filter((item) => {
    const matchesSearch =
      item.player.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.player.userId?.email || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesSport =
      !filterSport || item.player.sport?.name === filterSport;

    return matchesSearch && matchesSport;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Search athletes by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 placeholder:text-slate-400"
          />
        </div>

        {sportOptions.length > 0 && (
          <div className="w-full sm:w-56">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
            >
              <option value="">All Sports ({players.length})</option>
              {sportOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Roster Table */}
      {filteredPlayers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-xs">
          <span className="text-4xl block mb-3">📭</span>
          <h3 className="text-base font-bold text-slate-900">
            {isScoutView
              ? "No Players are Ready for Trial Yet"
              : "No players match the criteria"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
            Players automatically appear here once their closed practice session
            attendance reaches <strong>75% or higher</strong> and they have
            recorded scores in at least <strong>2 matches</strong>.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Closed Attendance
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Matches Played
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Readiness Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredPlayers.map(({ player, stats }) => (
                  <tr
                    key={player._id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-black text-sm">
                          {player.name.charAt(0)}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">
                            {player.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {player.age} yrs
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        {player.sport?.name || "Unassigned"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {stats.attendancePercent.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-400">
                          ({stats.closedPresent}/{stats.closedTotal} closed)
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ⚽ {stats.matchCount} Matches
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {stats.isReady ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                          <span>🏆</span> Ready for Trial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span>⏳</span> In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
