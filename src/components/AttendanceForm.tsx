"use client";

import { useState } from "react";
import { attendancePercent } from "@/domain/attendance";
import { formatISTDate } from "@/lib/utils";

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-xl font-black text-slate-900">
                {session.sport?.name || "Practice Session"}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isClosed
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
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
            <p className="text-xs text-slate-500">
              Date:{" "}
              <span className="font-semibold text-slate-700">
                {formatISTDate(session.dateKey)}
              </span>{" "}
              ({session.dateKey})
              {session.closedAt && (
                <span className="ml-2 text-slate-400">
                  • Closed at {new Date(session.closedAt).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isClosed ? (
              <>
                <button
                  type="button"
                  onClick={() => handleBulkMark("present")}
                  disabled={batchLoading || totalPlayers === 0}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMark("absent")}
                  disabled={batchLoading || totalPlayers === 0}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={handleCloseSession}
                  disabled={closing}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50 transition"
                >
                  {closing ? "Closing..." : "🔒 Lock & Close Session"}
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200">
                🔒 Records Locked (400 on edit)
              </span>
            )}
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            ✅ {successMessage}
          </div>
        )}

        {isClosed && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span>
              This session is closed. In accordance with academy policy,
              attendance data is frozen and subsequent modifications will return
              an error (400).
            </span>
          </div>
        )}

        {/* Attendance Statistics Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Total Roster
              </span>
              <p className="text-xl font-black text-slate-900">{totalPlayers}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
              <span className="text-[11px] font-bold uppercase text-emerald-600">
                Present
              </span>
              <p className="text-xl font-black text-emerald-700">
                {presentCount}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50/60 p-3 border border-rose-100">
              <span className="text-[11px] font-bold uppercase text-rose-600">
                Absent
              </span>
              <p className="text-xl font-black text-rose-700">{absentCount}</p>
            </div>
            <div className="rounded-xl bg-indigo-50/60 p-3 border border-indigo-100">
              <span className="text-[11px] font-bold uppercase text-indigo-600">
                Attendance %
              </span>
              <p
                className={`text-xl font-black ${
                  meetsThreshold ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Roster Attendance Rate</span>
              <span>
                Target: 75% {meetsThreshold ? "(Met ✅)" : "(Below ⚠️)"}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  meetsThreshold ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Attendance List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Player Attendance Roster
            </h3>
            <p className="text-xs text-slate-500">
              Attendance rows auto-generate as absent. Toggle status below.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="🔍 Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        {totalPlayers === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-3xl block mb-2">🏃</span>
            <p className="text-sm font-semibold text-slate-700">
              No active players for this sport
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Register active players assigned to {session.sport?.name} in the
              Players Roster.
            </p>
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-700">
              No players match your search filter
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Player Name
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Current Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Mark Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredAttendances.map((item) => {
                  const isPresent = item.status === "present";
                  const isLoading = loadingPlayerId === item.player._id;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                            {item.player?.name?.charAt(0) || "P"}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-900 block">
                              {item.player?.name}
                            </span>
                            {item.markedBy && (
                              <span className="text-[10px] text-slate-400">
                                Marked by {item.markedBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                        {item.player?.age} yrs
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isPresent
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
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
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(item.player._id, "present")
                            }
                            disabled={isClosed || isLoading || isPresent}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              isPresent
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60"
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
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              !isPresent
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-rose-700 hover:bg-slate-200/60"
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
        )}
      </div>
    </div>
  );
}
