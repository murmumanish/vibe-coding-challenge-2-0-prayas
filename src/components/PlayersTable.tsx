"use client";

import { useState } from "react";

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

  // Extract unique sports from player roster
  const sportOptions = Array.from(
    new Set(players.map((p) => p.sport?.name).filter(Boolean))
  );

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(search.toLowerCase()) ||
      (player.userId?.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesSport = !filterSport || player.sport?.name === filterSport;
    return matchesSearch && matchesSport;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Search players by name or login email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 placeholder:text-slate-400"
          />
        </div>

        {sportOptions.length > 0 && (
          <div className="w-full sm:w-56">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
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

      {/* Players List Table */}
      {filteredPlayers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          <span className="text-3xl block mb-2">🏃</span>
          <p className="text-sm font-semibold text-slate-700">No players found</p>
          <p className="text-xs text-slate-400 mt-1">
            {players.length === 0
              ? "No players have been registered yet."
              : "No players match your search filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Player Name
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Assigned Sport
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Portal Login Account
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredPlayers.map((player) => (
                  <tr key={player._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                          {player.name.charAt(0)}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {player.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {player.age} yrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        {player.sport?.name || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {player.userId?.email ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                          <span>🔑</span> {player.userId.email}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No login assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          player.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {player.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleToggleActive(player._id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                          player.isActive
                            ? "text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100"
                            : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
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
      )}
    </div>
  );
}
