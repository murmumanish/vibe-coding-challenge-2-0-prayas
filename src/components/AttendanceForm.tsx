"use client";

import { useState } from "react";
import { attendancePercent } from "@/domain/attendance";
import { formatISTDate } from "@/lib/utils";
import {
  SportsIcon,
  LockIcon,
  AlertIcon,
  CheckCircleIcon,
  AthleteIcon,
  SearchIcon,
} from "./Icons";

export interface AttendanceRecord {
  _id: string;
  session: string;
  player: {
    _id: string;
    name: string;
    age: number;
    isActive: boolean;
  };
  status: "present" | "absent";
  markedBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface SessionInfo {
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
  createdAt?: string;
}

interface AttendanceFormProps {
  session: SessionInfo;
  initialAttendances: AttendanceRecord[];
}

export function AttendanceForm({
  session: initialSession,
  initialAttendances,
}: AttendanceFormProps) {
  const [session, setSession] = useState<SessionInfo>(initialSession);
  const [attendances, setAttendances] =
    useState<AttendanceRecord[]>(initialAttendances);
  const [search, setSearch] = useState("");
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState(session.dateKey);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [updatingDate, setUpdatingDate] = useState(false);

  async function handleUpdateSessionDate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDate || editingDate === session.dateKey) {
      setIsEditingDate(false);
      return;
    }
    setUpdatingDate(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/sessions/${session._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey: editingDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update session date");
        return;
      }
      setSession((prev) => ({ ...prev, dateKey: editingDate }));
      setIsEditingDate(false);
      setSuccessMessage(`Session date updated to ${formatISTDate(editingDate)}.`);
    } catch {
      setError("Network error updating session date.");
    } finally {
      setUpdatingDate(false);
    }
  }

  const isClosed = session.status === "closed" || Boolean(session.closedAt);

  const totalPlayers = attendances.length;
  const presentCount = attendances.filter((a) => a.status === "present").length;
  const absentCount = totalPlayers - presentCount;
  const percentage = attendancePercent(presentCount, totalPlayers);
  const meetsThreshold = percentage >= 75;

  const filteredAttendances = attendances.filter((item) =>
    item.player?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle single player attendance
  async function handleToggleStatus(
    playerId: string,
    targetStatus: "present" | "absent"
  ) {
    if (isClosed) {
      setError("Cannot edit attendance for a closed session (400)");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoadingPlayerId(playerId);

    // Optimistic update
    const previousAttendances = [...attendances];
    setAttendances((prev) =>
      prev.map((item) =>
        item.player._id === playerId ? { ...item, status: targetStatus } : item
      )
    );

    try {
      const res = await fetch(`/api/sessions/${session._id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Rollback
        setAttendances(previousAttendances);
        setError(data.error || "Failed to update attendance");
        return;
      }
    } catch {
      setAttendances(previousAttendances);
      setError("Network error while updating attendance");
    } finally {
      setLoadingPlayerId(null);
    }
  }

  // Mark all filtered or all players
  async function handleBulkMark(status: "present" | "absent") {
    if (isClosed) {
      setError("Cannot edit attendance for a closed session (400)");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setBatchLoading(true);

    const updates = attendances.map((item) => ({
      playerId: item.player._id,
      status,
    }));

    const previousAttendances = [...attendances];
    setAttendances((prev) => prev.map((item) => ({ ...item, status })));

    try {
      const res = await fetch(`/api/sessions/${session._id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendances: updates }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAttendances(previousAttendances);
        setError(data.error || "Failed to update attendance in bulk");
        return;
      }

      setSuccessMessage(`All players marked as ${status}`);
    } catch {
      setAttendances(previousAttendances);
      setError("Network error while updating attendance");
    } finally {
      setBatchLoading(false);
    }
  }

  // Close session
  async function handleCloseSession() {
    if (isClosed) return;

    const confirmed = window.confirm(
      "Are you sure you want to close this session? Closing locks attendance and prevents any future modifications."
    );
    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);
    setClosing(true);

    try {
      const res = await fetch(`/api/sessions/${session._id}/close`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to close session");
        return;
      }

      setSession((prev) => ({
        ...prev,
        status: "closed",
        closedAt: data.session?.closedAt || new Date().toISOString(),
      }));
      setSuccessMessage(
        "Session successfully locked and closed. Attendance is now permanent."
      );
    } catch {
      setError("Network error while closing session");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Overview Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs transition-colors">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700">
                <SportsIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {session.sport?.name || "Practice Session"}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isClosed
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isClosed ? "bg-slate-400" : "bg-emerald-500 animate-pulse"
                  }`}
                />
                {isClosed ? "Session Closed (Locked)" : "Session Open"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Date:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatISTDate(session.dateKey)}
                </span>
                {session.closedAt && (
                  <span className="ml-2 text-slate-400 dark:text-slate-500">
                    • Closed at {new Date(session.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </p>
              {!isEditingDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDate(session.dateKey);
                    setIsEditingDate(true);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-[#ADD8E6]/40 dark:bg-[#ADD8E6]/20 text-slate-800 dark:text-slate-200 hover:bg-[#ADD8E6]/70 transition border border-blue-200 dark:border-slate-700"
                >
                  Change Date (Test)
                </button>
              ) : null}
            </div>

            {isEditingDate && (
              <form onSubmit={handleUpdateSessionDate} className="mt-2 flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={editingDate}
                  onChange={(e) => setEditingDate(e.target.value)}
                  required
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ADD8E6]"
                />
                <button
                  type="submit"
                  disabled={updatingDate}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] transition disabled:opacity-50"
                >
                  {updatingDate ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDate(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            {!isClosed ? (
              <>
                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkMark("present")}
                    disabled={batchLoading || totalPlayers === 0}
                    className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition text-center shadow-xs"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkMark("absent")}
                    disabled={batchLoading || totalPlayers === 0}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition text-center shadow-xs"
                  >
                    Mark All Absent
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCloseSession}
                  disabled={closing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50 transition text-center"
                >
                  <LockIcon className="w-3.5 h-3.5" />
                  {closing ? "Closing..." : "Lock & Close Session"}
                </button>
              </>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <LockIcon className="w-3.5 h-3.5" /> Records Locked (400 on edit)
              </span>
            )}
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400">
            <AlertIcon className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircleIcon className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {isClosed && (
          <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <LockIcon className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              This session is closed. In accordance with academy policy,
              attendance data is frozen and subsequent modifications will return
              an error (400).
            </span>
          </div>
        )}

        {/* Attendance Statistics Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
                Total Players
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{totalPlayers}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 p-3 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                Present
              </span>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                {presentCount}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50/60 dark:bg-rose-950/30 p-3 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400">
                Absent
              </span>
              <p className="text-xl font-black text-rose-700 dark:text-rose-400">{absentCount}</p>
            </div>
            <div className="rounded-xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/15 p-3 border border-blue-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                Attendance %
              </span>
              <p
                className={`text-xl font-black ${
                  meetsThreshold ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Attendance Rate</span>
              <span>100%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  meetsThreshold ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Player Attendance List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Player Attendance List
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Attendance rows auto-generate as absent. Toggle status below.
            </p>
          </div>

          <div className="w-full sm:w-64 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 focus:border-[#ADD8E6] placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {totalPlayers === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
              <AthleteIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No active players for this sport
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Register active players assigned to {session.sport?.name} in the
              Players section.
            </p>
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No players match your search filter
            </p>
          </div>
        ) : (
          <>
            {/* ── Mobile View: Player Attendance Cards (md:hidden) ── */}
            <div className="p-3.5 space-y-3 md:hidden">
              {filteredAttendances.map((item) => {
                const isPresent = item.status === "present";
                const isLoading = loadingPlayerId === item.player._id;

                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 shadow-xs transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700 font-bold text-sm shrink-0">
                          {item.player?.name?.charAt(0) || "P"}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.player?.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {item.player?.age} yrs
                            </span>
                            {item.markedBy && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                • Marked by {item.markedBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
                          isPresent
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPresent ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {isPresent ? "Present" : "Absent"}
                      </span>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(item.player._id, "present")
                        }
                        disabled={isClosed || isLoading || isPresent}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                          isPresent
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300"
                        } disabled:opacity-50`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(item.player._id, "absent")
                        }
                        disabled={isClosed || isLoading || !isPresent}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                          !isPresent
                            ? "bg-rose-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300"
                        } disabled:opacity-50`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop View: Full Data Table (hidden md:block) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Player Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Current Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Mark Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#18202c] divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAttendances.map((item) => {
                    const isPresent = item.status === "present";
                    const isLoading = loadingPlayerId === item.player._id;

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700 font-bold text-xs shrink-0">
                              {item.player?.name?.charAt(0) || "P"}
                            </span>
                            <div>
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                                {item.player?.name}
                              </span>
                              {item.markedBy && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  Marked by {item.markedBy.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {item.player?.age} yrs
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isPresent
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPresent ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {isPresent ? "Present" : "Absent"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(item.player._id, "present")
                              }
                              disabled={isClosed || isLoading || isPresent}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                isPresent
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                              } disabled:opacity-50`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(item.player._id, "absent")
                              }
                              disabled={isClosed || isLoading || !isPresent}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                !isPresent
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                              } disabled:opacity-50`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
