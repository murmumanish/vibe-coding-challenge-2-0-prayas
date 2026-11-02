"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Add New Sport</h2>
          <p className="text-xs text-slate-500 mt-0.5">
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
          <Button type="submit" loading={loading} disabled={!newSportName.trim()}>
            + Add Sport
          </Button>
        </form>
        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      </div>

      {/* Sport List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Configured Academy Sports</h2>
            <p className="text-xs text-slate-500">Archived sports block new practice & matches while keeping historical logs intact.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {sports.length} Total
          </span>
        </div>

        {fetching ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading sports...</div>
        ) : sports.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No sports configured yet. Add your first sport above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sports.map((sport) => (
              <div
                key={sport._id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm">
                    {sport.name.charAt(0)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sport.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400">slug: {sport.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      sport.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {sport.isActive ? "Active" : "Archived"}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(sport._id)}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                      sport.isActive
                        ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
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
