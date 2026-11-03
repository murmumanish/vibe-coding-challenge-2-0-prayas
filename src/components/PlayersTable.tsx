"use client";

import { useState } from "react";
import { AthleteIcon, SearchIcon, KeyIcon, SportsIcon } from "./Icons";

interface Player {
  _id: string;
  name: string;
  age: number;
  sport: {
    _id: string;
    name: string;
  };
  userId?: {
    _id: string;
    email: string;
  };
  isActive: boolean;
}

interface PlayersTableProps {
  initialPlayers: Player[];
}

export function PlayersTable({ initialPlayers }: PlayersTableProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [search, setSearch] = useState("");
  const [filterSport, setFilterSport] = useState("");

  async function handleToggleActive(id: string) {
    try {
      const res = await fetch(`/api/players/${id}`, { method: "PATCH" });
      if (res.ok) {
        const { player: updated } = await res.json();
        setPlayers((prev) =>
          prev.map((p) =>
            p._id === updated._id
              ? { ...p, isActive: updated.isActive }
              : p
          )
        );
      }
    } catch {
      alert("Failed to update status");
    }
  }

  // Extract unique sports from player list
  const sportOptions = Array.from(
    new Set(players.map((p) => p.sport?.name).filter(Boolean))
  );

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      (player.userId?.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesSport = !filterSport || player.sport?.name === filterSport;
    return matchesSearch && matchesSport;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#18202c] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search players by name or login email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        </div>

        {sportOptions.length > 0 && (
          <div className="w-full sm:w-56">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] bg-slate-50 dark:bg-slate-800 transition-colors"
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

      {/* Players List Table or Cards */}
      {filteredPlayers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-10 text-center transition-colors">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
            <AthleteIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No players found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {players.length === 0
              ? "No players have been registered yet."
              : "No players match your search filter."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Mobile View: Dedicated Material Player Cards (md:hidden) ── */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredPlayers.map((player) => (
              <div
                key={player._id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 shadow-xs transition-colors hover:shadow-sm"
              >
                {/* Card Header: Avatar + Name + Age + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#ADD8E6] text-slate-900 border border-blue-200 font-black text-base shadow-xs shrink-0">
                      {player.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {player.name}
                      </h4>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {player.age} years old
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${
                      player.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        player.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {player.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Info Strip: Sport & Portal Login */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <SportsIcon className="w-3.5 h-3.5 text-blue-600 dark:text-[#ADD8E6]" />
                    <span>{player.sport?.name || "Unassigned"}</span>
                  </span>

                  {player.userId?.email ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <KeyIcon className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{player.userId.email}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic px-1">
                      No portal login
                    </span>
                  )}
                </div>

                {/* Card Action: Full-width touch friendly */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => handleToggleActive(player._id)}
                    className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl border transition-all active:scale-[0.98] text-center ${
                      player.isActive
                        ? "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                    }`}
                  >
                    {player.isActive ? "Deactivate Player" : "Activate Player"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop View: Full Data Table (hidden md:block) ── */}
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Player Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Assigned Sport
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Portal Login Account
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#18202c] divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPlayers.map((player) => (
                    <tr key={player._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ADD8E6] text-slate-900 border border-blue-200 font-bold text-sm shadow-xs shrink-0">
                            {player.name.charAt(0)}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {player.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {player.age} yrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {player.sport?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {player.userId?.email ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                            <KeyIcon className="w-3.5 h-3.5 text-slate-500" /> {player.userId.email}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                            No login assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            player.isActive
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {player.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleToggleActive(player._id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            player.isActive
                              ? "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          }`}
                        >
                          {player.isActive ? "Deactivate" : "Activate"}
                        </button>
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
