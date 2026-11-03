"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatISTDate, getISTDateKey } from "@/lib/utils";
import {
  AddIcon,
  CloseIcon,
  AlertIcon,
  MatchIcon,
  SearchIcon,
  TargetIcon,
} from "./Icons";

interface SportOption {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface MatchItem {
  _id: string;
  dateKey: string;
  sport: {
    _id: string;
    name: string;
    slug: string;
  };
  opponent: string;
  location?: string;
  scoresCount?: number;
  createdBy?: {
    name: string;
  };
}

interface MatchesManagerProps {
  initialMatches: MatchItem[];
  sports: SportOption[];
}

export function MatchesManager({
  initialMatches,
  sports,
}: MatchesManagerProps) {
  const router = useRouter();
  const [matches] = useState<MatchItem[]>(initialMatches);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [sportId, setSportId] = useState(
    sports.length > 0 ? sports[0]._id : ""
  );
  const [dateKey, setDateKey] = useState(getISTDateKey());
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterSport, setFilterSport] = useState("");

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!sportId || !dateKey || !opponent.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportId,
          dateKey,
          opponent: opponent.trim(),
          location: location.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create match");
        return;
      }

      setShowModal(false);
      router.push(`/coach/matches/${data.match._id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredMatches = matches.filter((m) => {
    const matchesSearch =
      m.opponent.toLowerCase().includes(search.toLowerCase()) ||
      (m.location || "").toLowerCase().includes(search.toLowerCase());
    const matchesSport = !filterSport || m.sport?._id === filterSport;
    return matchesSearch && matchesSport;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Academy Matches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule matches and record verified player performance scores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#ADD8E6] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 border border-[#96cce0] shadow-xs hover:bg-[#9cd0e2] active:bg-[#8cc4d8] active:scale-95 transition"
        >
          <AddIcon className="w-4 h-4" /> Record New Match
        </button>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-2xl animate-in fade-in zoom-in-95 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record New Match
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Note: Match scoring enforces practice attendance. Ensure players
              were marked <strong>present</strong> in today&apos;s practice
              session.
            </p>

            <form onSubmit={handleCreateMatch} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Sport
                </label>
                <select
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6]"
                  required
                >
                  {sports.length === 0 ? (
                    <option value="">No active sports available</option>
                  ) : (
                    sports.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Match Date
                </label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Opponent Academy / Team
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Xavier's Academy, Ranchi FC"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Location / Venue (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Academy Main Turf, Ranchi Stadium"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs font-semibold text-red-700 dark:text-red-400">
                  <AlertIcon className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || sports.length === 0}
                  className="rounded-xl bg-[#ADD8E6] px-4 py-2 text-xs font-bold text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] shadow-xs disabled:opacity-50 transition"
                >
                  {submitting ? "Creating..." : "Create Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#18202c] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search matches by opponent or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {sports.length > 0 && (
          <div className="w-full sm:w-48">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] bg-slate-50 dark:bg-slate-800"
            >
              <option value="">All Sports ({matches.length})</option>
              {sports.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-10 text-center transition-colors">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
            <MatchIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No matches found
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {matches.length === 0
              ? "Record your first academy match using the button above."
              : "No matches match your search criteria."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Mobile View: Dedicated Match Cards (md:hidden) ── */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredMatches.map((m) => (
              <div
                key={m._id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 shadow-xs transition-colors hover:shadow-sm"
              >
                {/* Header: Fixture & Sport Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700 font-black text-xs shrink-0">
                      {m.sport?.name?.charAt(0) || "M"}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Dumka vs {m.opponent}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {formatISTDate(m.dateKey)}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0">
                    {m.sport?.name || "Sport"}
                  </span>
                </div>

                {/* Details Strip: Venue & Scores */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {m.location ? `Venue: ${m.location}` : "Home Turf"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700">
                    <TargetIcon className="w-3 h-3 text-blue-700 dark:text-[#ADD8E6]" />
                    {m.scoresCount || 0} scored
                  </span>
                </div>

                {/* Action */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <Link
                    href={`/coach/matches/${m._id}`}
                    className="w-full inline-flex items-center justify-center gap-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] shadow-xs transition active:scale-[0.98] text-center"
                  >
                    View Score
                  </Link>
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
                      Fixture
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Sport
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Match Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Scores
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#18202c] divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMatches.map((m) => (
                    <tr
                      key={m._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700 font-black text-sm shrink-0">
                            {m.sport?.name?.charAt(0) || "M"}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                              Dumka Academy
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              vs <span className="font-bold text-slate-900 dark:text-slate-100">{m.opponent}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {m.sport?.name || "Sport"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {formatISTDate(m.dateKey)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {m.location || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700">
                          <TargetIcon className="w-3 h-3 text-blue-700 dark:text-[#ADD8E6]" /> {m.scoresCount || 0} scored
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/coach/matches/${m._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] shadow-xs transition"
                        >
                          View Score
                        </Link>
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
