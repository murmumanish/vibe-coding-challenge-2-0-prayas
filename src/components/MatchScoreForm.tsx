"use client";

import { useState, useEffect } from "react";
import { formatISTDate } from "@/lib/utils";
import {
  ClipboardIcon,
  CheckIcon,
  AlertIcon,
  CheckCircleIcon,
  AddIcon,
  MatchIcon,
} from "./Icons";

export interface MatchScoreItem {
  _id: string;
  primaryScore: number;
  stats?: Record<string, unknown>;
  player: {
    _id?: string;
    id?: string;
    name: string;
    age: number;
  };
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface EligiblePlayerItem {
  player: {
    _id?: string;
    id?: string;
    name: string;
    age: number;
  };
  alreadyScored: boolean;
}

interface MatchScoreFormProps {
  match: {
    _id: string;
    dateKey: string;
    sport: {
      _id: string;
      name: string;
    };
    opponent: string;
    location?: string;
  };
  initialScores: MatchScoreItem[];
  initialEligiblePlayers: EligiblePlayerItem[];
}

function getPlayerId(player: { _id?: string; id?: string } | undefined): string {
  if (!player) return "";
  return String(player._id || player.id || "");
}

export function MatchScoreForm({
  match,
  initialScores,
  initialEligiblePlayers,
}: MatchScoreFormProps) {
  const [currentMatch, setCurrentMatch] = useState(match);
  const [scores, setScores] = useState<MatchScoreItem[]>(initialScores);
  const [eligiblePlayers, setEligiblePlayers] = useState<EligiblePlayerItem[]>(
    initialEligiblePlayers
  );

  const unscoredEligibles = eligiblePlayers.filter((e) => !e.alreadyScored);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
    return unscoredEligibles.length > 0
      ? getPlayerId(unscoredEligibles[0].player)
      : "";
  });

  const [primaryScore, setPrimaryScore] = useState<number | "">(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Testing: Match date editing & session linking
  const [editingDate, setEditingDate] = useState(match.dateKey);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [updatingDate, setUpdatingDate] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<
    Array<{
      _id: string;
      dateKey: string;
      attendanceStats?: { present: number; total: number };
    }>
  >([]);

  useEffect(() => {
    const sportId = match.sport?._id;
    if (!sportId) return;
    fetch(`/api/sessions?sportId=${sportId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sessions) {
          setAvailableSessions(data.sessions);
        }
      })
      .catch(() => {});
  }, [match.sport?._id]);

  async function handleUpdateMatchDate(newDate: string) {
    if (!newDate) return;
    setUpdatingDate(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/matches/${currentMatch._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey: newDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update match date");
        return;
      }
      setCurrentMatch((prev) => ({ ...prev, dateKey: newDate }));
      setEditingDate(newDate);
      if (data.eligiblePlayers) {
        setEligiblePlayers(data.eligiblePlayers);
      }
      setIsEditingDate(false);
      setSuccess(
        `Match date updated to ${formatISTDate(newDate)}. Eligible players reloaded.`
      );
    } catch {
      setError("Network error updating match date.");
    } finally {
      setUpdatingDate(false);
    }
  }

  // Automatically keep selectedPlayerId in sync if the list of unscored players changes
  useEffect(() => {
    if (unscoredEligibles.length > 0) {
      const currentExists = unscoredEligibles.some(
        (e) => getPlayerId(e.player) === selectedPlayerId
      );
      if (!currentExists || !selectedPlayerId) {
        setSelectedPlayerId(getPlayerId(unscoredEligibles[0].player));
      }
    } else {
      setSelectedPlayerId("");
    }
  }, [unscoredEligibles, selectedPlayerId]);

  async function handleAddScore(e: React.FormEvent) {
    e.preventDefault();

    const playerIdToSend =
      selectedPlayerId ||
      (unscoredEligibles.length > 0
        ? getPlayerId(unscoredEligibles[0].player)
        : "");

    if (!playerIdToSend) {
      setError("Please select an eligible player.");
      return;
    }

    if (primaryScore === "" || Number(primaryScore) < 0) {
      setError("Score cannot be negative.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/matches/${currentMatch._id}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: playerIdToSend,
          player: playerIdToSend,
          primaryScore: Number(primaryScore),
          score: Number(primaryScore),
          stats: notes ? { notes } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record match score");
        return;
      }

      const scoredPlayer = eligiblePlayers.find(
        (e) => getPlayerId(e.player) === playerIdToSend
      )?.player;

      const newScoreItem: MatchScoreItem = {
        ...data.score,
        player:
          data.score?.player && typeof data.score.player === "object" && data.score.player.name
            ? data.score.player
            : {
                _id: playerIdToSend,
                id: playerIdToSend,
                name: scoredPlayer?.name || "Player",
                age: scoredPlayer?.age || 0,
              },
      };

      setScores((prev) => [newScoreItem, ...prev]);
      setEligiblePlayers((prev) =>
        prev.map((e) =>
          getPlayerId(e.player) === playerIdToSend
            ? { ...e, alreadyScored: true }
            : e
        )
      );

      // Select next unscored player if available
      const remaining = unscoredEligibles.filter(
        (e) => getPlayerId(e.player) !== playerIdToSend
      );
      setSelectedPlayerId(
        remaining.length > 0 ? getPlayerId(remaining[0].player) : ""
      );
      setPrimaryScore(0);
      setNotes("");
      setSuccess("Match score recorded successfully!");
    } catch {
      setError("Network error while recording match score");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Match Overview Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h2 className="w-full sm:w-auto text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white grid grid-cols-[1fr_auto_1fr] sm:flex items-center gap-2 sm:gap-3 text-center sm:text-left">
                <span className="text-right sm:text-left truncate">Dumka Academy</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 self-center">
                  vs
                </span>
                <span className="text-left truncate">{currentMatch.opponent}</span>
              </h2>

              <span className="self-center sm:self-auto inline-flex rounded-full bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-bold w-fit">
                {currentMatch.sport?.name}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 flex-wrap">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Date:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatISTDate(currentMatch.dateKey)}
                </span>
                {currentMatch.location && (
                  <span className="ml-2 font-medium text-slate-600 dark:text-slate-400">
                    • Venue: {currentMatch.location}
                  </span>
                )}
              </p>
              {!isEditingDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDate(currentMatch.dateKey);
                    setIsEditingDate(true);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-[#ADD8E6]/40 dark:bg-[#ADD8E6]/20 text-slate-800 dark:text-slate-200 hover:bg-[#ADD8E6]/70 transition border border-blue-200 dark:border-slate-700"
                >
                  Change Date (Test)
                </button>
              ) : null}
            </div>

            {isEditingDate && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Match Date:
                  </span>
                  <input
                    type="date"
                    value={editingDate}
                    onChange={(e) => setEditingDate(e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ADD8E6]"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateMatchDate(editingDate)}
                    disabled={updatingDate}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] transition disabled:opacity-50"
                  >
                    {updatingDate ? "Saving..." : "Save Date"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>

                {availableSessions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Or link to existing session:
                    </span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleUpdateMatchDate(e.target.value);
                      }}
                      defaultValue=""
                      disabled={updatingDate}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ADD8E6]"
                    >
                      <option value="" disabled>
                        Select a practice session...
                      </option>
                      {availableSessions.map((s) => (
                        <option key={s._id} value={s.dateKey}>
                          {formatISTDate(s.dateKey)} ({s.attendanceStats?.present ?? 0} present)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {scores.length} Player Scores Recorded
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Score Form Card */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs h-fit transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Record Player Score
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Select an eligible player from today&apos;s practice attendance list.
          </p>

          {unscoredEligibles.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
              <ClipboardIcon className="w-7 h-7 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
              <p className="font-bold text-slate-700 dark:text-slate-200">
                No Unscored Eligible Players
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {eligiblePlayers.length === 0
                  ? "No players were marked present in practice for this sport and date."
                  : "All eligible practice attendees have recorded scores for this match."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleAddScore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Eligible Player
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6]"
                  required
                >
                  {unscoredEligibles.map(({ player }) => {
                    const id = getPlayerId(player);
                    return (
                      <option key={id} value={id}>
                        {player?.name || "Player"} ({player?.age ?? 0} yrs)
                      </option>
                    );
                  })}
                </select>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Verified present in practice session
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Primary Score (Goals / Points / Runs)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={primaryScore}
                  onChange={(e) =>
                    setPrimaryScore(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Match Notes / Stats (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 assists, 1 clean tackle, MVP"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs font-semibold text-red-700 dark:text-red-400">
                  <AlertIcon className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" /> {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ADD8E6] py-2.5 text-xs font-bold text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] shadow-xs disabled:opacity-50 transition"
              >
                <AddIcon className="w-4 h-4" />
                {submitting ? "Saving Score..." : "Record Score"}
              </button>
            </form>
          )}
        </div>

        {/* Scores Table Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden transition-colors">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Official Match Scores
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official scores count towards the 2-match readiness standard.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {scores.length} Scored
            </span>
          </div>

          {scores.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
                <MatchIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No scores recorded yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Record performance scores for practice-eligible players using the
                form on the left.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {scores.map((score) => {
                const notes = (score.stats as { notes?: string })?.notes;
                return (
                  <div
                    key={score._id}
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 shadow-xs hover:shadow-sm hover:border-[#ADD8E6] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Athlete Identity Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ADD8E6] text-slate-900 border border-blue-200 font-black text-sm shrink-0 shadow-xs">
                            {score.player?.name?.charAt(0) || "P"}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {score.player?.name}
                            </h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {score.player?.age ? `${score.player.age} yrs old` : "Player"}
                            </span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          <CheckIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Verified
                        </span>
                      </div>

                      {/* Performance Score Box */}
                      <div className="mt-3.5 p-3 rounded-xl bg-white dark:bg-[#18202c] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Match Score
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {match.sport?.name || "Official"} Score
                          </span>
                        </div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white px-3 py-1 rounded-xl bg-[#ADD8E6]/35 dark:bg-[#ADD8E6]/15 border border-[#ADD8E6]/60 dark:border-slate-700 shadow-xs">
                          {score.primaryScore}
                        </span>
                      </div>
                    </div>

                    {/* Match Notes / Observations */}
                    {notes && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-300 italic flex items-start gap-1.5">
                        <span className="text-slate-400 not-italic text-sm leading-none">&ldquo;</span>
                        <span className="line-clamp-2">{notes}</span>
                        <span className="text-slate-400 not-italic text-sm leading-none">&rdquo;</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
