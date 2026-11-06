"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { AddIcon, CheckIcon, TrashIcon } from "@/components/Icons";
import { Skeleton } from "@/components/Skeleton";

interface ScoreField {
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

interface Sport {
  _id: string;
  name: string;
  slug: string;
  isPreset?: boolean;
  isActive: boolean;
  scoreFields?: ScoreField[];
}

interface SportPresetItem {
  name: string;
  slug: string;
  scoreFields: ScoreField[];
  isInstalled?: boolean;
  isActive?: boolean;
}

interface OptionalFieldDraft {
  label: string;
  integer: boolean;
  unit: string;
}

export function SportManager() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [presets, setPresets] = useState<SportPresetItem[]>([]);
  const [creationMode, setCreationMode] = useState<"preset" | "custom">("preset");

  // Custom sport form state
  const [customName, setCustomName] = useState("");
  const [primaryLabel, setPrimaryLabel] = useState("");
  const [primaryInteger, setPrimaryInteger] = useState(true);
  const [primaryUnit, setPrimaryUnit] = useState("");
  const [optionalFields, setOptionalFields] = useState<OptionalFieldDraft[]>([]);

  const [loading, setLoading] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetching, setFetching] = useState(true);

  async function fetchSportsAndPresets() {
    try {
      const [sportsRes, presetsRes] = await Promise.all([
        fetch("/api/sports"),
        fetch("/api/sports?presets=true"),
      ]);

      if (sportsRes.ok) {
        const data = await sportsRes.json();
        setSports(data.sports || []);
      }
      if (presetsRes.ok) {
        const pData = await presetsRes.json();
        setPresets(pData.presets || []);
      }
    } catch {
      setError("Failed to load sports list");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchSportsAndPresets();
  }, []);

  async function handleAddPreset(slug: string) {
    setError("");
    setSuccess("");
    setInstallingSlug(slug);

    try {
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetSlug: slug }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add preset sport");
        return;
      }

      setSuccess(`Added ${data.sport.name} to academy catalog!`);
      await fetchSportsAndPresets();
    } catch {
      setError("Something went wrong");
    } finally {
      setInstallingSlug(null);
    }
  }

  function handleAddOptionalFieldRow() {
    setOptionalFields((prev) => [
      ...prev,
      { label: "", integer: true, unit: "" },
    ]);
  }

  function handleRemoveOptionalField(index: number) {
    setOptionalFields((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateOptionalField(
    index: number,
    field: Partial<OptionalFieldDraft>
  ) {
    setOptionalFields((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...field } : item))
    );
  }

  async function handleCreateCustomSport(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim()) {
      setError("Please enter a sport name.");
      return;
    }
    if (!primaryLabel.trim()) {
      setError("Please define the primary headline scoring metric (e.g. Points, Goals).");
      return;
    }

    // Build scoreFields payload
    const scoreFieldsPayload = [
      {
        label: primaryLabel.trim(),
        integer: primaryInteger,
        unit: primaryUnit.trim() || undefined,
        isPrimary: true,
        required: true,
      },
      ...optionalFields
        .filter((f) => f.label.trim())
        .map((f) => ({
          label: f.label.trim(),
          integer: f.integer,
          unit: f.unit.trim() || undefined,
          isPrimary: false,
          required: false,
        })),
    ];

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          scoreFields: scoreFieldsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create custom sport");
        return;
      }

      setSuccess(`Sport "${data.sport.name}" created with custom scorecard!`);
      setCustomName("");
      setPrimaryLabel("");
      setPrimaryInteger(true);
      setPrimaryUnit("");
      setOptionalFields([]);
      await fetchSportsAndPresets();
    } catch {
      setError("Something went wrong creating sport");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string) {
    try {
      const res = await fetch(`/api/sports/${id}`, { method: "PATCH" });
      if (res.ok) {
        fetchSportsAndPresets();
      }
    } catch {
      setError("Failed to update sport status");
    }
  }

  return (
    <div className="space-y-6">
      {/* Creation Mode Switcher Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Add Sport &amp; Scorecard Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose from standard Academy Presets or build a sport with custom primary and secondary scoring metrics.
            </p>
          </div>

          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setCreationMode("preset");
                setError("");
                setSuccess("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creationMode === "preset"
                  ? "bg-white dark:bg-[#18202c] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Presets Library
            </button>
            <button
              type="button"
              onClick={() => {
                setCreationMode("custom");
                setError("");
                setSuccess("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creationMode === "custom"
                  ? "bg-white dark:bg-[#18202c] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Custom Sport Builder
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {success}
          </div>
        )}

        {/* Tab 1: Presets Catalog */}
        {creationMode === "preset" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {presets.map((preset) => {
                const primaryField = preset.scoreFields.find((f) => f.isPrimary);
                const otherFields = preset.scoreFields.filter((f) => !f.isPrimary);
                const isInstalled = preset.isInstalled;

                return (
                  <div
                    key={preset.slug}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 flex flex-col justify-between hover:border-[#ADD8E6] transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {preset.name}
                        </h4>
                        {isInstalled ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckIcon className="w-3 h-3" /> Added
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            Preset
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Primary:
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] font-bold text-[11px]">
                            {primaryField?.label}
                            {primaryField?.unit ? ` (${primaryField.unit})` : ""}
                            {!primaryField?.integer && " · Decimal"}
                          </span>
                        </div>

                        {otherFields.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Stats:
                            </span>
                            {otherFields.map((f) => (
                              <span
                                key={f.key}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium"
                              >
                                {f.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60">
                      <Button
                        type="button"
                        onClick={() => handleAddPreset(preset.slug)}
                        disabled={isInstalled || installingSlug === preset.slug}
                        loading={installingSlug === preset.slug}
                        variant={isInstalled ? "secondary" : "primary"}
                        className="w-full text-xs py-1.5"
                      >
                        {isInstalled ? "Already in Catalog" : "Add to Academy"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Sport Builder */}
        {creationMode === "custom" && (
          <form onSubmit={handleCreateCustomSport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  id="custom-sport-name"
                  label="Sport Name"
                  placeholder="e.g. Archery, Boxing, Weightlifting"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>

              {/* Primary Score Metric Config */}
              <div className="p-3.5 rounded-xl border border-[#ADD8E6]/60 dark:border-slate-700 bg-[#ADD8E6]/10 dark:bg-slate-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Headline Primary Metric (Required)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ADD8E6] text-slate-900">
                    Primary
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Field Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Points, Goals"
                      value={primaryLabel}
                      onChange={(e) => setPrimaryLabel(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ADD8E6]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Format
                    </label>
                    <select
                      value={primaryInteger ? "int" : "dec"}
                      onChange={(e) => setPrimaryInteger(e.target.value === "int")}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ADD8E6]"
                    >
                      <option value="int">Whole Number (Runs, Goals)</option>
                      <option value="dec">Decimal (Time, Weight, Dist)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. s, pts, kg"
                      value={primaryUnit}
                      onChange={(e) => setPrimaryUnit(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ADD8E6]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional / Secondary Metrics Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Additional Optional Metrics
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add optional performance stats recorded per match (e.g. Assists, Catches, Tackles).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddOptionalFieldRow}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <AddIcon className="w-3.5 h-3.5" /> Add Metric
                </button>
              </div>

              {optionalFields.length > 0 && (
                <div className="space-y-2">
                  {optionalFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-7 gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 items-center"
                    >
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Metric Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Assists, Fouls, Wickets"
                          value={field.label}
                          onChange={(e) =>
                            handleUpdateOptionalField(idx, { label: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Format
                        </label>
                        <select
                          value={field.integer ? "int" : "dec"}
                          onChange={(e) =>
                            handleUpdateOptionalField(idx, {
                              integer: e.target.value === "int",
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="int">Whole Number</option>
                          <option value="dec">Decimal</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. s, m"
                          value={field.unit}
                          onChange={(e) =>
                            handleUpdateOptionalField(idx, { unit: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionalField(idx)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Remove metric"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={loading} className="gap-1.5">
                <AddIcon className="w-4 h-4" /> Save Sport &amp; Scorecard
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Configured Sports Catalog Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Configured Academy Sports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Archived sports protect historical match records and lock new session creation.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {sports.length} Total
          </span>
        </div>

        {fetching ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : sports.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500">
            No sports configured yet. Choose a preset or create a custom sport above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sports.map((sport) => {
              const primary = sport.scoreFields?.find((f) => f.isPrimary);
              const optional = sport.scoreFields?.filter((f) => !f.isPrimary);

              return (
                <div
                  key={sport._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 font-bold text-sm shrink-0 border border-blue-200 dark:border-slate-700">
                      {sport.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {sport.name}
                        </h3>
                        {sport.isPreset && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            Preset
                          </span>
                        )}
                      </div>

                      {/* Scorecard Summary Pill */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Primary: {primary?.label || "Score"}
                          {primary?.unit ? ` (${primary.unit})` : ""}
                          {primary?.integer === false ? " (decimal)" : ""}
                        </span>
                        {optional && optional.length > 0 && (
                          <span className="text-slate-400 dark:text-slate-500">
                            · Stats: {optional.map((o) => o.label).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        sport.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {sport.isActive ? "Active" : "Archived"}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(sport._id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        sport.isActive
                          ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                          : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                      }`}
                    >
                      {sport.isActive ? "Archive" : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
