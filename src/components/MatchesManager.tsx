"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatISTDate, getISTDateKey } from "@/lib/utils";
import { CloseIcon, AlertIcon } from "./Icons";
import { HistoryList, SportOption } from "./HistoryList";
import { Plus, Target, MapPin } from "lucide-react";

export interface MatchItem {
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

  function renderMatchCard(match: MatchItem) {
    return (
      <div className="rounded-2xl border border-card-border bg-card p-3.5 sm:p-4 shadow-xs transition-colors hover:shadow-sm">
        {/* Header: Fixture & Sport Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-container text-primary-on-container border border-card-border font-black text-xs shrink-0">
              {match.sport?.name?.charAt(0) || "M"}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                Dumka vs {match.opponent}
              </h4>
              <span className="text-xs text-foreground opacity-60 font-medium block truncate">
                {formatISTDate(match.dateKey)}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background text-foreground border border-card-border shrink-0">
            {match.sport?.name || "Sport"}
          </span>
        </div>

        {/* Details Strip: Venue & Scores */}
        <div className="mt-3 pt-3 border-t border-card-border flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-foreground opacity-70">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{match.location ? match.location : "Home Turf"}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-primary-on-container border border-card-border">
            <Target className="w-3 h-3 text-primary" />
            <span>{match.scoresCount || 0} scored</span>
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-3 border-t border-card-border flex justify-center sm:justify-end">
          <Link
            href={`/coach/matches/${match._id}`}
            className="w-48 sm:w-auto min-w-[140px] inline-flex items-center justify-center gap-1.5 py-2 px-6 text-xs sm:text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs transition active:scale-[0.98] text-center"
          >
            View Scores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Match Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-card-border">
              <h3 className="text-base font-bold text-foreground">
                Record Official Match
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-foreground opacity-60 hover:opacity-100 p-1 rounded-lg"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground opacity-80 mb-1">
                  Sport
                </label>
                <select
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground opacity-80 mb-1">
                  Match Date
                </label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground opacity-80 mb-1">
                  Opponent Academy / Team
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Xavier's Academy, Ranchi FC"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-foreground/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground opacity-80 mb-1">
                  Location / Venue (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Academy Main Turf, Ranchi Stadium"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-foreground/40"
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
                  className="rounded-xl border border-card-border px-4 py-2 text-xs font-bold text-foreground opacity-70 hover:opacity-100 hover:bg-card-hover transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || sports.length === 0}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary-hover border border-card-border shadow-xs disabled:opacity-50 transition"
                >
                  {submitting ? "Creating..." : "Create Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared HistoryList View */}
      <HistoryList<MatchItem>
        itemType="match"
        title="Matches & Fixtures"
        subtitle="Organise matches, record match-day eligibility, and log player performance."
        sports={sports}
        initialItems={initialMatches}
        headerAction={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={sports.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs disabled:opacity-50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Match</span>
          </button>
        }
        renderItem={renderMatchCard}
        renderEmptyAction={
          sports.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-hover border border-card-border transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Match</span>
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
