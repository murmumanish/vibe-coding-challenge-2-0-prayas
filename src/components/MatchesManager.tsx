"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatISTDate, getISTDateKey } from "@/lib/utils";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Official Academy Matches
          </h2>
          <p className="text-xs text-slate-500">
            Record official tournament and friendly matches with score verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          <span>+</span> Record New Match
        </button>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Record New Match
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Note: Match scoring enforces practice attendance. Ensure players
              were marked <strong>present</strong> in today&apos;s practice
              session.
            </p>

            <form onSubmit={handleCreateMatch} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Sport
                </label>
                <select
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Match Date (IST)
                </label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Opponent Academy / Team
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Xavier's Academy, Ranchi FC"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Location / Venue (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Academy Main Turf, Ranchi Stadium"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 placeholder:text-slate-400"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || sports.length === 0}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {submitting ? "Creating..." : "Create Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Search matches by opponent or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 placeholder:text-slate-400"
          />
        </div>

        {sports.length > 0 && (
          <div className="w-full sm:w-48">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
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
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-xs">
          <span className="text-3xl block mb-2">⚽</span>
          <p className="text-sm font-semibold text-slate-700">
            No matches found
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {matches.length === 0
              ? "Record your first academy match using the button above."
              : "No matches match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date (IST)
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Scores Recorded
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredMatches.map((m) => (
                  <tr
                    key={m._id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs">
                          ⚽
                        </span>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">
                            Dumka Academy vs {m.opponent}
                          </span>
                          <span className="text-xs text-slate-400">
                            Opponent: {m.opponent}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        {m.sport?.name || "Sport"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-800">
                        {formatISTDate(m.dateKey)}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-400">
                        {m.dateKey}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {m.location || <span className="text-slate-300 italic">—</span>}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ⚽ {m.scoresCount || 0} Scored
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/coach/matches/${m._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs transition"
                      >
                        Match Stats →
                      </Link>
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
