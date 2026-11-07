"use client";

import { useState, useEffect } from "react";
import {
  AthleteIcon,
  SearchIcon,
  SportsIcon,
  CloseIcon,
  PhoneIcon,
  MailIcon,
  ClipboardIcon,
  MatchIcon,
} from "./Icons";
import { formatISTDate } from "@/lib/utils";
import { ProfileStatsSkeleton } from "./Skeleton";

export interface Player {
  _id: string;
  name: string;
  age: number;
  phone?: string;
  sport: {
    _id: string;
    name: string;
    slug?: string;
  };
  userId?: {
    _id: string;
    email: string;
  };
  isActive: boolean;
  createdAt?: string;
}

export interface PlayerStatsData {
  closedTotal: number;
  closedPresent: number;
  closedPercent: number;
  totalSessions: number;
  totalPresent: number;
  totalPercent: number;
  matchCount: number;
  matchScores?: Array<{
    _id: unknown;
    primaryScore: number;
    stats?: Record<string, unknown>;
    match: {
      _id: unknown;
      dateKey: string;
      opponent: string;
      location?: string;
      sport?: {
        name: string;
      };
    };
  }>;
}

interface PlayersTableProps {
  initialPlayers: Player[];
  readOnly?: boolean;
  showSportFilter?: boolean;
}

export function PlayersTable({ initialPlayers, readOnly = false, showSportFilter = !readOnly }: PlayersTableProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [search, setSearch] = useState("");
  const [filterSport, setFilterSport] = useState("");

  // Modal / Dialog state for View More Player Profile
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // Close dialog on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedPlayer(null);
      }
    }
    if (selectedPlayer) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedPlayer]);

  // Fetch full stats whenever a player modal is opened
  async function handleOpenProfile(player: Player) {
    setSelectedPlayer(player);
    setPlayerStats(null);
    setLoadingStats(true);

    try {
      const res = await fetch(`/api/players/${player._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setPlayerStats(data.stats);
        }
        if (data.player) {
          // Sync any fresh fields like phone if available
          setSelectedPlayer((prev) => (prev ? { ...prev, ...data.player } : data.player));
        }
      }
    } catch {
      // Gracefully fall back to local player data
    } finally {
      setLoadingStats(false);
    }
  }

  async function handleToggleActive(id: string) {
    setTogglingActive(true);
    try {
      const res = await fetch(`/api/players/${id}`, { method: "PATCH" });
      if (res.ok) {
        const { player: updated } = await res.json();
        setPlayers((prev) =>
          prev.map((p) =>
            p._id === updated._id ? { ...p, isActive: updated.isActive } : p
          )
        );
        if (selectedPlayer && selectedPlayer._id === updated._id) {
          setSelectedPlayer((prev) =>
            prev ? { ...prev, isActive: updated.isActive } : null
          );
        }
      }
    } catch {
      alert("Failed to update player status");
    } finally {
      setTogglingActive(false);
    }
  }

  // Extract unique sports from player list
  const sportOptions = Array.from(
    new Set(players.map((p) => p.sport?.name).filter(Boolean))
  );

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      (player.userId?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (player.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      (player.sport?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesSport = !showSportFilter || !filterSport || player.sport?.name === filterSport;
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
            placeholder="Search players by name, email, or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        </div>

        {showSportFilter && sportOptions.length > 0 && (
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

      {/* Players Small Cards Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-10 text-center transition-colors">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
            <AthleteIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No players found
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {players.length === 0
              ? "No players have been registered yet."
              : "No players match your search filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredPlayers.map((player) => (
            <div
              key={player._id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-3 shadow-xs hover:border-[#ADD8E6] dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Avatar, Name, Age, Sport & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#ADD8E6] text-slate-900 border border-blue-200 font-black text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-sm font-bold text-slate-900 dark:text-white truncate"
                        title={player.name}
                      >
                        {player.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{player.age} yrs</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 truncate">
                          <SportsIcon className="w-2.5 h-2.5 text-blue-600 dark:text-[#ADD8E6] shrink-0" />
                          <span className="truncate">{player.sport?.name || "Unassigned"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      player.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        player.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {player.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Slim Action Button at bottom: View More */}
              <button
                type="button"
                onClick={() => handleOpenProfile(player)}
                className="mt-2.5 w-full inline-flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-bold rounded-lg bg-slate-50 hover:bg-[#ADD8E6] hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-[#ADD8E6] dark:hover:text-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition active:scale-[0.98]"
              >
                <span>View More</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Player Profile Dialog (Modal) ── */}
      {selectedPlayer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="player-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="relative w-full max-w-lg my-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Banner */}
            <div className="bg-[#EBF6F9] dark:bg-slate-800/70 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 relative">
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                aria-label="Close dialog"
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700 transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ADD8E6] text-slate-900 border border-blue-200 font-black text-2xl shadow-sm shrink-0">
                  {selectedPlayer.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 pr-8">
                  <h2
                    id="player-profile-title"
                    className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate"
                  >
                    {selectedPlayer.name}
                  </h2>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#ADD8E6] text-slate-900 border border-blue-300">
                      <SportsIcon className="w-3.5 h-3.5 text-slate-900" />
                      <span>{selectedPlayer.sport?.name || "Unassigned"}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        selectedPlayer.isActive
                          ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedPlayer.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {selectedPlayer.isActive ? "Active Player" : "Inactive Player"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body: Personal & Contact Information */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Player Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Email */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <MailIcon className="w-3.5 h-3.5 text-slate-500" />
                      Portal Email
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {selectedPlayer.userId?.email || "No student account created"}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <PhoneIcon className="w-3.5 h-3.5 text-slate-500" />
                      Contact Phone
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {selectedPlayer.phone || "Not provided"}
                    </span>
                  </div>

                  {/* Age */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      Age
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {selectedPlayer.age} years old
                    </span>
                  </div>

                  {/* Player ID */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      Academy Player ID
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {selectedPlayer._id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance & Practice Activity */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Academy Activity & Scores
                </h4>

                {loadingStats ? (
                  <ProfileStatsSkeleton />
                ) : playerStats ? (
                  <div className="space-y-3">
                    {/* Practice Attendance Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ClipboardIcon className="w-4 h-4 text-blue-600 dark:text-[#ADD8E6]" />
                          Practice Attendance
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {playerStats.closedPercent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#ADD8E6] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(playerStats.closedPercent, 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>
                          Present: {playerStats.closedPresent} of {playerStats.closedTotal} closed sessions
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {playerStats.closedPercent >= 75 ? "Target Met" : "Target: 100%"}
                        </span>
                      </p>
                    </div>

                    {/* Official Match Scores Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MatchIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Official Match Scores
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                          {playerStats.matchCount} Matches Scored
                        </span>
                      </div>

                      {playerStats.matchScores && playerStats.matchScores.length > 0 ? (
                        <div className="space-y-1.5 mt-2.5 max-h-36 overflow-y-auto pr-1">
                          {playerStats.matchScores.map((score, idx) => (
                            <div
                              key={String(score._id || idx)}
                              className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-slate-900 dark:text-white truncate block">
                                  vs {score.match?.opponent || "Opponent"}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {score.match?.dateKey ? formatISTDate(score.match.dateKey) : "Match"}
                                </span>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-[#ADD8E6]/40 dark:bg-[#ADD8E6]/20 font-black text-slate-900 dark:text-white text-xs shrink-0 border border-blue-200 dark:border-slate-700">
                                {score.primaryScore}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1">
                          No official match scores recorded yet.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Performance details available once practice sessions are conducted.
                  </p>
                )}
              </div>

              {/* Password Privacy Notice */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
                <strong>Privacy Protected:</strong> Student login password is fully encrypted with bcrypt and never exposed for security.
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {readOnly ? (
                <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Sport assignment &amp; status managed by Academy Owner.
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleActive(selectedPlayer._id)}
                  disabled={togglingActive}
                  className={`py-2 px-4 rounded-xl text-xs font-bold border transition ${
                    selectedPlayer.isActive
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                  }`}
                >
                  {togglingActive
                    ? "Updating..."
                    : selectedPlayer.isActive
                    ? "Deactivate Player"
                    : "Activate Player"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] transition shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
