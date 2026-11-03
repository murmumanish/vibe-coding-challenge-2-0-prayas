"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { AddIcon } from "@/components/Icons";

interface Sport {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export function SportManager() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [newSportName, setNewSportName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);

  async function fetchSports() {
    try {
      const res = await fetch("/api/sports");
      if (res.ok) {
        const data = await res.json();
        setSports(data.sports);
      }
    } catch {
      setError("Failed to load sports list");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchSports();
  }, []);

  async function handleAddSport(e: React.FormEvent) {
    e.preventDefault();
    if (!newSportName.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSportName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add sport");
        return;
      }

      setNewSportName("");
      fetchSports();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string) {
    try {
      const res = await fetch(`/api/sports/${id}`, { method: "PATCH" });
      if (res.ok) {
        fetchSports();
      }
    } catch {
      setError("Failed to update sport status");
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Sport Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs transition-colors">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Sport</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dynamic sport catalog: sports are not hardcoded. Enter any sport offered by the academy.
          </p>
        </div>

        <form onSubmit={handleAddSport} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              id="sport-name"
              label="Sport Name"
              placeholder="e.g. Badminton, Archery, Boxing"
              value={newSportName}
              onChange={(e) => setNewSportName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={loading} disabled={!newSportName.trim()} className="gap-1.5">
            <AddIcon className="w-4 h-4" /> Add Sport
          </Button>
        </form>
        {error && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* Sport List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Configured Academy Sports</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Archived sports block new practice & matches while keeping historical logs intact.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {sports.length} Total
          </span>
        </div>

        {fetching ? (
          <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500">Loading sports...</div>
        ) : sports.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500">
            No sports configured yet. Add your first sport above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sports.map((sport) => (
              <div
                key={sport._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 font-bold text-sm shrink-0 border border-blue-200 dark:border-slate-700">
                    {sport.name.charAt(0)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sport.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">slug: {sport.slug}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
