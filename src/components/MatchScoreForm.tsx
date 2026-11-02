"use client";

import { useState, useEffect } from "react";
import { formatISTDate } from "@/lib/utils";

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
      const res = await fetch(`/api/matches/${match._id}/scores`, {
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Dumka Academy</span>
                <span className="text-slate-400 font-semibold text-sm uppercase">vs</span>
                <span>{match.opponent}</span>
              </h2>
              <span className="inline-flex rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold">
                {match.sport?.name}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Date:{" "}
              <span className="font-semibold text-slate-700">
                {formatISTDate(match.dateKey)}
              </span>{" "}
              ({match.dateKey})
              {match.location && (
                <span className="ml-2 font-medium text-slate-600">
                  • Venue: {match.location}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
              {scores.length} Player Scores Recorded
            </span>
          </div>
        </div>

        {/* Proof of Attendance Requirement Rule Banner */}
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800 flex items-start gap-2.5">
          <span className="text-base leading-none">🛡️</span>
          <div>
            <strong className="font-bold">Proof of Attendance Rule:</strong>{" "}
            Players are only eligible to have match scores recorded if they were
            marked <strong>&ldquo;present&rdquo;</strong> in a practice session
            for <strong>{match.sport?.name}</strong> on{" "}
            <strong>{match.dateKey}</strong>.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Score Form Card */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Record Player Score
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Select an eligible player from today&apos;s practice attendance roster.
          </p>

          {unscoredEligibles.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500 text-xs">
              <span className="text-2xl block mb-2">📋</span>
              <p className="font-bold text-slate-700">
                No Unscored Eligible Players
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {eligiblePlayers.length === 0
                  ? "No players were marked present in practice for this sport and date."
                  : "All eligible practice attendees have recorded scores for this match."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleAddScore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Eligible Player
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
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
                <span className="text-[11px] text-emerald-600 mt-1 block">
                  ✓ Verified present in practice session
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Match Notes / Stats (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 assists, 1 clean tackle, MVP"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 placeholder:text-slate-400"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                  ✅ {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {submitting ? "Saving Score..." : "+ Record Score"}
              </button>
            </form>
          )}
        </div>

        {/* Scores Table Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Match Scores
              </h3>
              <p className="text-xs text-slate-500">
                Official scores count towards the 2-match readiness standard.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {scores.length} Scored
            </span>
          </div>

          {scores.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="text-3xl block mb-2">⚽</span>
              <p className="text-sm font-semibold text-slate-700">
                No scores recorded yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Record performance scores for practice-eligible players using the
                form on the left.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Primary Score
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {scores.map((score) => (
                    <tr
                      key={score._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                            {score.player?.name?.charAt(0) || "P"}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {score.player?.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                        {score.player?.age} yrs
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {score.primaryScore}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {(score.stats as { notes?: string })?.notes || (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
