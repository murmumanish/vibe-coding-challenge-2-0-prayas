"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatISTDate, getISTDateKey } from "@/lib/utils";
import { CloseIcon, AlertIcon } from "./Icons";
import { HistoryList, SportOption } from "./HistoryList";
import { Plus, Calendar } from "lucide-react";

export interface SessionItem {
  _id: string;
  dateKey: string;
  sport: {
    _id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  status: "open" | "closed";
  closedAt?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  attendanceStats?: {
    total: number;
    present: number;
  };
}

interface SessionsManagerProps {
  initialSessions: SessionItem[];
  sports: SportOption[];
}

export function SessionsManager({
  initialSessions,
  sports,
}: SessionsManagerProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true" || params.get("open") === "true") {
        setShowCreateModal(true);
      }
    }
  }, []);

  // Form states
  const [selectedSportId, setSelectedSportId] = useState(
    sports.length > 0 ? sports[0]._id : ""
  );
  const [dateKey, setDateKey] = useState(getISTDateKey());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSportId || !dateKey) return;

    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportId: selectedSportId,
          dateKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create session");
        return;
      }

      setShowCreateModal(false);
      // Navigate immediately to the newly created session's attendance sheet
      router.push(`/coach/sessions/${data.session._id}`);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function renderSessionCard(session: SessionItem) {
    const isOpen = session.status === "open";
    const total = session.attendanceStats?.total || 0;
    const present = session.attendanceStats?.present || 0;
    const percent = total > 0 ? ((present / total) * 100).toFixed(0) : "0";

    return (
      <div className="rounded-2xl border border-card-border bg-card p-3.5 sm:p-4 shadow-xs transition-colors hover:shadow-sm">
        {/* Card Header: Sport + Date + Status Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-container text-primary-on-container border border-card-border font-black text-xs shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                {formatISTDate(session.dateKey)}
              </h4>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
              isOpen
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-background text-foreground opacity-70 border border-card-border"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>

        {/* Bottom Strip: Attendance info + Action Button */}
        <div className="mt-3 pt-3 border-t border-card-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-foreground opacity-70 shrink-0">
              Attendance:
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                Number(percent) >= 75
                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                  : "bg-background text-foreground border border-card-border"
              }`}
            >
              {present}/{total} ({percent}%)
            </span>
          </div>

          <Link
            href={`/coach/sessions/${session._id}`}
            className={`inline-flex items-center justify-center gap-1 py-1.5 px-3.5 text-xs font-bold rounded-xl transition shadow-xs active:scale-[0.98] shrink-0 ${
              isOpen
                ? "bg-primary text-primary-foreground hover:bg-primary-hover border border-card-border"
                : "bg-background text-foreground hover:bg-card-hover border border-card-border"
            }`}
          >
            {isOpen ? "Mark Attendance" : "View Sheet"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Creation Modal / Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-card-border">
              <h3 className="text-base font-bold text-foreground">
                Open Daily Practice Session
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-foreground opacity-60 hover:opacity-100 p-1 rounded-lg"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-foreground opacity-70 mt-2">
              Opening a session will automatically create attendance records
              marked as <strong>absent</strong> for all active players in the
              selected sport.
            </p>

            <form onSubmit={handleCreateSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground opacity-80 mb-1">
                  Sport
                </label>
                <select
                  value={selectedSportId}
                  onChange={(e) => setSelectedSportId(e.target.value)}
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
                {sports.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    Please configure active sports in Sports Config first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground opacity-80 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  required
                />
                <span className="text-[11px] text-foreground opacity-60 mt-1 block">
                  Daily practice session for active players.
                </span>
              </div>

              {createError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs font-semibold text-red-700 dark:text-red-400">
                  <AlertIcon className="w-4 h-4 shrink-0" /> {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-card-border px-4 py-2 text-xs font-bold text-foreground opacity-70 hover:opacity-100 hover:bg-card-hover transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || sports.length === 0}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary-hover border border-card-border shadow-xs disabled:opacity-50 transition"
                >
                  {creating ? "Opening..." : "Open Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared HistoryList View */}
      <HistoryList<SessionItem>
        itemType="session"
        title="Practice Sessions"
        subtitle="Open daily practice sessions, record player attendance, and lock records."
        sports={sports}
        initialItems={initialSessions}
        headerAction={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={sports.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs disabled:opacity-50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Open Session</span>
          </button>
        }
        renderItem={renderSessionCard}
        renderEmptyAction={
          sports.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-hover border border-card-border transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Open First Session</span>
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
