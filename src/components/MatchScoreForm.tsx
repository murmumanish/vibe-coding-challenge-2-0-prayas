"use client";

import { useState, useEffect } from "react";
import { formatISTDate } from "@/lib/utils";
import { SPORT_PRESETS } from "@/domain/sportPresets";
import {
  ClipboardIcon,
  CheckIcon,
  AlertIcon,
  CheckCircleIcon,
  AddIcon,
  MatchIcon,
} from "./Icons";

export interface ScoreFieldConfig {
  key: string;
  label: string;
  type?: string;
  min?: number;
  integer?: boolean;
  unit?: string;
  required?: boolean;
  isPrimary?: boolean;
  isActive?: boolean;
}

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
      slug?: string;
      scoreFields?: ScoreFieldConfig[];
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


export interface ScoreParamItem {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
}

export function getScoreParameters(
  score: MatchScoreItem,
  sportFields: ScoreFieldConfig[],
  primaryField: ScoreFieldConfig
): ScoreParamItem[] {
  const result: ScoreParamItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Process all configured sport fields in order
  for (const f of sportFields) {
    if (f.isActive === false) continue;
    seenKeys.add(f.key);

    let val: any = undefined;
    if (f.isPrimary || f.key === primaryField.key) {
      val = score.primaryScore;
    } else if (score.stats && typeof score.stats === "object") {
      val = (score.stats as Record<string, unknown>)[f.key];
    }

    if (val === undefined || val === null || val === "") {
      val = 0;
    }

    result.push({
      key: f.key,
      label: f.label,
      value: val,
      unit: f.unit,
    });
  }

  // 2. Also check if there are additional recorded stats not in sportFields (except notes)
  if (score.stats && typeof score.stats === "object") {
    for (const [k, v] of Object.entries(score.stats as Record<string, unknown>)) {
      if (
        k === "notes" ||
        k === "primaryScore" ||
        k === "score" ||
        k.toLowerCase() === "score" ||
        k === "_id" ||
        seenKeys.has(k)
      ) {
        continue;
      }
      if (typeof v === "number" || typeof v === "string") {
        const prettyLabel = k
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim();
        result.push({
          key: k,
          label: prettyLabel,
          value: v,
        });
      }
    }
  }

  // Fallback: If result is empty, at least show primary score
  if (result.length === 0) {
    result.push({
      key: primaryField.key || "score",
      label: primaryField.label || "Score",
      value: score.primaryScore,
      unit: primaryField.unit,
    });
  }

  return result;
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

  // 1. Resolve dynamic score fields from sport or preset fallback
  const sportPreset = currentMatch.sport
    ? SPORT_PRESETS.find(
        (p) =>
          p.slug === currentMatch.sport.slug ||
          p.name.toLowerCase() === (currentMatch.sport.name || "").toLowerCase()
      )
    : undefined;

  const resolvedSportFields: ScoreFieldConfig[] =
    currentMatch.sport?.scoreFields && currentMatch.sport.scoreFields.length > 0
      ? currentMatch.sport.scoreFields
      : sportPreset
      ? (sportPreset.scoreFields as ScoreFieldConfig[])
      : [
          {
            key: "score",
            label: "Score",
            type: "number",
            min: 0,
            integer: true,
            unit: "pts",
            required: true,
            isPrimary: true,
            isActive: true,
          },
        ];

  const primaryField =
    resolvedSportFields.find((f) => f.isPrimary && f.isActive !== false) ||
    resolvedSportFields[0];

  const secondaryFields = resolvedSportFields.filter(
    (f) => !f.isPrimary && f.isActive !== false
  );

  const [primaryScore, setPrimaryScore] = useState<number | "">("");
  const [secondaryStats, setSecondaryStats] = useState<Record<string, number | "">>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Quick Inline Add Metric feature right on Match page
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetricLabel, setNewMetricLabel] = useState("");
  const [newMetricInteger, setNewMetricInteger] = useState(true);
  const [newMetricUnit, setNewMetricUnit] = useState("");
  const [addingMetric, setAddingMetric] = useState(false);

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

  function handleStepSecondary(key: string, delta: number, min: number = 0) {
    setSecondaryStats((prev) => {
      const current =
        prev[key] === "" || prev[key] === undefined ? 0 : Number(prev[key]);
      const nextVal = Math.max(min, current + delta);
      return { ...prev, [key]: nextVal };
    });
  }

  async function handleAddMetricToSport(e: React.FormEvent) {
    e.preventDefault();
    if (!newMetricLabel.trim()) return;

    setAddingMetric(true);
    setError(null);

    try {
      const res = await fetch(`/api/sports/${currentMatch.sport._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addScoreField: {
            label: newMetricLabel.trim(),
            integer: newMetricInteger,
            unit: newMetricUnit.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add scoring metric");
        return;
      }

      if (data.sport?.scoreFields) {
        setCurrentMatch((prev) => ({
          ...prev,
          sport: {
            ...prev.sport,
            scoreFields: data.sport.scoreFields,
          },
        }));
      }

      setSuccess(`Added metric "${newMetricLabel.trim()}" to ${currentMatch.sport.name}!`);
      setNewMetricLabel("");
      setNewMetricUnit("");
      setNewMetricInteger(true);
      setShowAddMetric(false);
    } catch {
      setError("Failed to add metric to sport");
    } finally {
      setAddingMetric(false);
    }
  }

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

    if (primaryScore === "" || isNaN(Number(primaryScore))) {
      setError(`Please enter a valid ${primaryField.label}.`);
      return;
    }

    const numScore = Number(primaryScore);
    const minVal = primaryField.min ?? 0;
    if (numScore < minVal) {
      setError(`${primaryField.label} cannot be less than ${minVal}.`);
      return;
    }

    if (primaryField.integer !== false && !Number.isInteger(numScore)) {
      setError(`${primaryField.label} must be a whole number.`);
      return;
    }

    // Build stats payload
    const statsPayload: Record<string, unknown> = {};
    statsPayload[primaryField.key] = numScore;
    for (const f of secondaryFields) {
      const v = secondaryStats[f.key];
      if (v !== "" && v !== undefined && v !== null && !isNaN(Number(v))) {
        statsPayload[f.key] = Number(v);
      }
    }
    if (notes.trim()) {
      statsPayload.notes = notes.trim();
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
          primaryScore: numScore,
          score: numScore,
          stats: statsPayload,
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
          data.score?.player &&
          typeof data.score.player === "object" &&
          data.score.player.name
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
      setPrimaryScore("");
      setSecondaryStats({});
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
      <div className="rounded-2xl border border-card-border bg-card p-4 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h2 className="w-full sm:w-auto text-base sm:text-xl md:text-2xl font-black text-foreground grid grid-cols-[1fr_auto_1fr] sm:flex items-center gap-2 sm:gap-3 text-center sm:text-left">
                <span className="text-right sm:text-left truncate">Dumka Academy</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal shrink-0">vs</span>
                <span className="text-left truncate text-slate-700 dark:text-slate-200">{currentMatch.opponent}</span>
              </h2>
              <span className="self-center sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-foreground border border-card-border">
                {currentMatch.sport?.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Date:</span>
                <span className="font-medium text-foreground">
                  {formatISTDate(currentMatch.dateKey)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingDate((v) => !v)}
                  className="ml-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 underline hover:opacity-80"
                >
                  {isEditingDate ? "Cancel" : "Change Date"}
                </button>
              </div>
              {currentMatch.location && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Venue:</span>
                  <span>{currentMatch.location}</span>
                </div>
              )}
            </div>

            {/* Inline Match Date Switcher for Verification & Session Linking */}
            {isEditingDate && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Link Match to Practice Session Date
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Matches require present practice attendance on the exact same date
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={editingDate}
                    onChange={(e) => setEditingDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-foreground"
                  />
                  <button
                    type="button"
                    disabled={updatingDate || editingDate === currentMatch.dateKey}
                    onClick={() => handleUpdateMatchDate(editingDate)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-[#9cd0e2] disabled:opacity-50 transition"
                  >
                    {updatingDate ? "Updating..." : "Update Date & Reload Attendees"}
                  </button>

                  {availableSessions.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-500">
                      <span>Quick Pick Session:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setEditingDate(e.target.value);
                            handleUpdateMatchDate(e.target.value);
                          }
                        }}
                        defaultValue=""
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-foreground"
                      >
                        <option value="" disabled>Select Practice Date</option>
                        {availableSessions.map((s) => (
                          <option key={s._id} value={s.dateKey}>
                            {s.dateKey} ({s.attendanceStats?.present ?? 0} present)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Roster Stats Banner */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
              <span className="block text-lg font-black text-foreground">
                {eligiblePlayers.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Practice Attendees
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-primary-container border border-card-border text-center">
              <span className="block text-lg font-black text-foreground">
                {scores.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Scores Recorded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Score Entry Form + Recorded Scores Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Recording Form Card */}
        <div className="rounded-2xl border border-card-border bg-card p-4 sm:p-6 shadow-xs transition-colors">
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">
              Record Athlete Score
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strict Rule: Athlete must be verified present in practice on this match date.
            </p>
          </div>

          {unscoredEligibles.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-center">
              <ClipboardIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {eligiblePlayers.length === 0
                  ? "No practice attendance found"
                  : "All attendees scored"}
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
                  Eligible Athlete
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

              {/* Dynamic Primary Field Input */}
              <div className="p-3.5 rounded-xl border border-card-border bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {primaryField.label}
                    {primaryField.unit ? ` (${primaryField.unit})` : ""}
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Headline
                  </span>
                </div>
                <input
                  type="number"
                  min={primaryField.min ?? 0}
                  step={primaryField.integer === false ? "0.01" : "1"}
                  placeholder={
                    primaryField.integer === false
                      ? "e.g. 31.42 (decimals allowed)"
                      : "e.g. 45 (whole number)"
                  }
                  value={primaryScore}
                  onChange={(e) =>
                    setPrimaryScore(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]"
                  required
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {primaryField.integer === false
                    ? "Decimal values supported (e.g. swim times in seconds)"
                    : "Must be a whole integer"}
                </p>
              </div>

              {/* Secondary Scoring Metrics Stepper Grid */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Additional Sport Parameters
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddMetric((v) => !v)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <AddIcon className="w-3 h-3" />
                    {showAddMetric ? "Cancel" : "Add Metric to Sport"}
                  </button>
                </div>

                {/* Inline Metric Creator */}
                {showAddMetric && (
                  <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2 animate-in fade-in duration-200">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      Add New Stat to {currentMatch.sport?.name} (e.g. Sixes, Tackles, Assists)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Metric name (e.g. Catches)"
                        value={newMetricLabel}
                        onChange={(e) => setNewMetricLabel(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-foreground"
                        required
                      />
                      <select
                        value={newMetricInteger ? "int" : "dec"}
                        onChange={(e) => setNewMetricInteger(e.target.value === "int")}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-foreground"
                      >
                        <option value="int">Whole Number</option>
                        <option value="dec">Decimal</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Unit (e.g. s, pts)"
                        value={newMetricUnit}
                        onChange={(e) => setNewMetricUnit(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-foreground"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddMetric(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={addingMetric || !newMetricLabel.trim()}
                        onClick={handleAddMetricToSport}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-primary text-primary-foreground hover:bg-[#9cd0e2] disabled:opacity-50 transition"
                      >
                        {addingMetric ? "Adding..." : "Save Metric"}
                      </button>
                    </div>
                  </div>
                )}

                {secondaryFields.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic p-2 border border-dashed rounded-lg border-slate-200 dark:border-slate-700">
                    No optional metrics configured for this sport. Click &ldquo;Add Metric to Sport&rdquo; above to add one.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {secondaryFields.map((field) => {
                      const val = secondaryStats[field.key] ?? "";
                      const isDec = field.integer === false;

                      return (
                        <div
                          key={field.key}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                        >
                          <div>
                            <span className="text-xs font-bold text-foreground block">
                              {field.label}
                            </span>
                            {field.unit && (
                              <span className="text-[10px] text-slate-400">
                                unit: {field.unit}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isDec && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepSecondary(field.key, -1, field.min ?? 0)
                                }
                                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-sm flex items-center justify-center transition"
                              >
                                -
                              </button>
                            )}

                            <input
                              type="number"
                              min={field.min ?? 0}
                              step={isDec ? "0.01" : "1"}
                              value={val}
                              placeholder="0"
                              onChange={(e) =>
                                setSecondaryStats((prev) => ({
                                  ...prev,
                                  [field.key]:
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                }))
                              }
                              className="w-16 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 text-xs text-foreground font-bold"
                            />

                            {!isDec && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepSecondary(field.key, 1, field.min ?? 0)
                                }
                                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-sm flex items-center justify-center transition"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Coach Observations / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Coach Notes / Observations (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent defensive footing, clutch score"
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
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs disabled:opacity-50 transition"
              >
                <AddIcon className="w-4 h-4" />
                {submitting ? "Saving Score..." : "Record Score"}
              </button>
            </form>
          )}
        </div>

        {/* Scores Table Card */}
        <div className="lg:col-span-2 rounded-2xl border border-card-border bg-card shadow-xs overflow-hidden transition-colors">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
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
              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
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
                const parameters = getScoreParameters(
                  score,
                  resolvedSportFields,
                  primaryField
                );

                return (
                  <div
                    key={score._id}
                    className="rounded-2xl border border-card-border bg-card p-4 sm:p-5 shadow-xs hover:shadow-sm hover:border-primary transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Athlete Identity Row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-container text-foreground font-black text-sm shrink-0 shadow-xs">
                            {score.player?.name?.charAt(0) || "P"}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
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

                      {/* Match Performance Parameters (All Equally Represented) */}
                      <div className="rounded-xl border border-card-border bg-slate-50/70 dark:bg-slate-800/40 p-2.5 sm:p-3 shadow-2xs divide-y divide-card-border">
                        {parameters.map((param) => (
                          <div
                            key={param.key}
                            className="flex items-center justify-between py-1.5 sm:py-2 first:pt-0 last:pb-0 text-xs sm:text-sm font-semibold"
                          >
                            <span className="font-bold text-foreground flex items-center gap-1">
                              <span>{param.label}</span>
                              {param.unit && (
                                <span className="text-[11px] font-normal text-slate-400">
                                  ({param.unit})
                                </span>
                              )}
                              <span className="text-slate-400 font-bold ml-0.5">:</span>
                            </span>
                            <span className="font-black text-foreground text-xs sm:text-sm px-2.5 py-0.5 rounded-lg bg-primary-container border border-card-border min-w-[36px] text-center">
                              {param.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Match Notes / Observations */}
                    {notes && (
                      <div className="mt-3 pt-2.5 border-t border-card-border text-xs text-slate-600 dark:text-slate-300 italic flex items-start gap-1.5">
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
