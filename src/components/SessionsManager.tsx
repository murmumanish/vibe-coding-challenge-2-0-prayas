"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatISTDate, getISTDateKey } from "@/lib/utils";
import {
  AddIcon,
  CloseIcon,
  AlertIcon,
  ClipboardIcon,
} from "./Icons";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Practice Sessions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Open daily practice sessions, record player attendance, and lock records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError("");
            setShowCreateModal(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#ADD8E6] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 border border-[#96cce0] shadow-xs hover:bg-[#9cd0e2] active:bg-[#8cc4d8] active:scale-95 transition"
        >
          <AddIcon className="w-4 h-4" /> Open New Session
        </button>
      </div>

      {/* Creation Modal / Card */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-2xl animate-in fade-in zoom-in-95 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Open Daily Practice Session
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Opening a session will automatically create attendance records
              marked as <strong>absent</strong> for all active players in the
              selected sport.
            </p>

            <form onSubmit={handleCreateSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Sport
                </label>
                <select
                  value={selectedSportId}
                  onChange={(e) => setSelectedSportId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6]"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6]"
                  required
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
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
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || sports.length === 0}
                  className="rounded-xl bg-[#ADD8E6] px-4 py-2 text-xs font-bold text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] shadow-xs disabled:opacity-50 transition"
                >
                  {creating ? "Opening..." : "Open Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#18202c] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-48">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] bg-slate-50 dark:bg-slate-800"
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
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] bg-slate-50 dark:bg-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold text-right">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </span>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-10 text-center transition-colors">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
            <ClipboardIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No practice sessions found
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {sessions.length === 0
              ? "Open your first daily session using the button above."
              : "No sessions match your filter criteria."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Mobile View: Dedicated Practice Session Cards (md:hidden) ── */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredSessions.map((session) => {
              const isOpen = session.status === "open";
              const total = session.attendanceStats?.total || 0;
              const present = session.attendanceStats?.present || 0;
              const percent = total > 0 ? ((present / total) * 100).toFixed(0) : "0";

              return (
                <div
                  key={session._id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 shadow-xs transition-colors hover:shadow-sm"
                >
                  {/* Card Header: Sport + Status Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700 font-black text-xs shrink-0">
                        {session.sport?.name?.charAt(0) || "S"}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {session.sport?.name || "Practice Session"}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {formatISTDate(session.dateKey)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${
                        isOpen
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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

                  {/* Attendance Stats Strip */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Player Attendance
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {present} / {total} present
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          Number(percent) >= 75
                            ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/coach/sessions/${session._id}`}
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold rounded-xl transition text-center shadow-xs active:scale-[0.98] ${
                        isOpen
                          ? "bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0]"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isOpen ? "Mark Attendance →" : "View Attendance Sheet"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop View: Full Data Table (hidden md:block) ── */}
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Sport
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Session Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#18202c] divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSessions.map((session) => {
                    const isOpen = session.status === "open";
                    const total = session.attendanceStats?.total || 0;
                    const present = session.attendanceStats?.present || 0;
                    const percent =
                      total > 0 ? ((present / total) * 100).toFixed(0) : "0";

                    return (
                      <tr
                        key={session._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700 font-black text-xs shrink-0">
                              {session.sport?.name?.charAt(0) || "S"}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {session.sport?.name || "Unknown Sport"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {formatISTDate(session.dateKey)}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isOpen
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {present} / {total}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                Number(percent) >= 75
                                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
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
                                ? "bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
        </>
      )}
    </div>
  );
}
