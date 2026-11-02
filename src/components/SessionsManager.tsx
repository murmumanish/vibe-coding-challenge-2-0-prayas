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

interface SessionItem {
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
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [selectedSportId, setSelectedSportId] = useState(
    sports.length > 0 ? sports[0]._id : ""
  );
  const [dateKey, setDateKey] = useState(getISTDateKey());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Filters
  const [filterSport, setFilterSport] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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
      setCreateError("Something went wrong. Please check your network.");
    } finally {
      setCreating(false);
    }
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSport =
      !filterSport || session.sport?._id === filterSport;
    const matchesStatus =
      !filterStatus || session.status === filterStatus;
    return matchesSport && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Practice Log</h2>
          <p className="text-xs text-slate-500">
            Open daily sessions to auto-populate rosters and record attendance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError("");
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          <span>+</span> Open New Session
        </button>
      </div>

      {/* Creation Modal / Card */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Open Daily Practice Session
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Opening a session will automatically create attendance records
              marked as <strong>absent</strong> for all active players in the
              selected sport.
            </p>

            <form onSubmit={handleCreateSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Sport
                </label>
                <select
                  value={selectedSportId}
                  onChange={(e) => setSelectedSportId(e.target.value)}
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
                {sports.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Please configure active sports in Sports Config first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Date (IST)
                </label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Enforces one session per sport per calendar day.
                </span>
              </div>

              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  ⚠️ {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || sports.length === 0}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {creating ? "Opening..." : "Open Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-48">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
            >
              <option value="">All Sports ({sessions.length})</option>
              {sports.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-semibold text-right">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </span>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-sm font-semibold text-slate-700">
            No practice sessions found
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {sessions.length === 0
              ? "Open your first daily session using the button above."
              : "No sessions match your filter criteria."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date (IST)
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredSessions.map((session) => {
                  const isOpen = session.status === "open";
                  const total = session.attendanceStats?.total || 0;
                  const present = session.attendanceStats?.present || 0;
                  const percent =
                    total > 0 ? ((present / total) * 100).toFixed(0) : "0";

                  return (
                    <tr
                      key={session._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs">
                            {session.sport?.name?.charAt(0) || "S"}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {session.sport?.name || "Unknown Sport"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-800">
                          {formatISTDate(session.dateKey)}
                        </span>
                        <span className="block text-[11px] font-mono text-slate-400">
                          {session.dateKey}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isOpen
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOpen
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-slate-400"
                            }`}
                          />
                          {isOpen ? "Open" : "Closed"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {present} / {total} Present
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              Number(percent) >= 75
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/coach/sessions/${session._id}`}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            isOpen
                              ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isOpen ? "Mark Attendance →" : "View Attendance"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
