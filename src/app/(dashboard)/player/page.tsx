import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Player from "@/models/Player";
import {
  getPlayerAttendanceStats,
  PlayerMatchScoreItem,
} from "@/services/player.service";
import { isReady } from "@/domain/readiness";
import { meetsAttendanceThreshold } from "@/domain/attendance";
import { formatISTDate } from "@/lib/utils";

export default async function PlayerDashboard() {
  const session = await getSession();
  if (!session || session.role !== "player") {
    redirect("/login");
  }

  await dbConnect();
  const player = await Player.findOne({ userId: session.userId })
    .populate("sport", "name slug")
    .lean();

  const playerName = player?.name || session.email;
  const sportName =
    (player?.sport as unknown as { name?: string })?.name || "Unassigned";

  // If student player profile exists, fetch live attendance & readiness stats
  let stats = {
    closedTotal: 0,
    closedPresent: 0,
    closedPercent: 0,
    totalSessions: 0,
    totalPresent: 0,
    totalPercent: 0,
    matchCount: 0,
    attendances: [] as Array<{
      _id: unknown;
      status: "present" | "absent";
      session: {
        _id: unknown;
        dateKey: string;
        status: "open" | "closed";
        closedAt?: Date;
        sport?: {
          _id: unknown;
          name: string;
          slug: string;
        };
      };
      createdAt: Date;
    }>,
    matchScores: [] as PlayerMatchScoreItem[],
  };

  if (player) {
    stats = await getPlayerAttendanceStats(player._id);
  }

  const hasClosedSessions = stats.closedTotal > 0;
  const hasAnySessions = stats.totalSessions > 0;

  // Determine display attendance rate:
  // Prefer closed sessions rate (official trial readiness metric).
  // If no closed sessions exist yet, display overall attendance from active sessions.
  const displayPercentage = hasClosedSessions
    ? stats.closedPercent
    : hasAnySessions
    ? stats.totalPercent
    : 0;

  const isThresholdMet = meetsAttendanceThreshold(
    stats.closedPresent,
    stats.closedTotal
  );

  const trialReady = isReady({
    presentCount: stats.closedPresent,
    closedSessionCount: stats.closedTotal,
    matchCount: stats.matchCount,
  });

  return (
    <div className="space-y-6">
      {/* Player Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-900 p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold mb-3">
            <span>🏃</span> Student Athlete Portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome, {playerName}!
          </h1>
          <p className="mt-2 text-indigo-100 text-sm max-w-lg">
            Track your personal attendance records, review match scores, and
            monitor your Scout Readiness status.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 text-9xl select-none pointer-events-none translate-x-8 translate-y-6">
          🏅
        </div>
      </div>

      {/* Student Profile Summary */}
      {player ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 text-2xl font-black">
              {player.name.charAt(0)}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{player.name}</h2>
              <p className="text-xs text-slate-500">
                Age: {player.age} yrs &bull; Login: {session.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-400 block">
                Enrolled Sport
              </span>
              <span className="text-sm font-bold text-indigo-600">
                {sportName}
              </span>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                player.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {player.isActive ? "Active Roster" : "Inactive"}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          ⚠️ <strong>Player profile unlinked:</strong> Your login account is not
          associated with an active player record yet. Please ask your academy coach
          to add you to the roster with this email address.
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Attendance Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Attendance Rate
              </span>
              {hasClosedSessions ? (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isThresholdMet
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {isThresholdMet ? "Target Met (≥75%)" : "Below Target (<75%)"}
                </span>
              ) : hasAnySessions ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Active Practice
                </span>
              ) : null}
            </div>

            <p
              className={`text-4xl font-black mt-3 ${
                hasClosedSessions
                  ? isThresholdMet
                    ? "text-emerald-600"
                    : "text-amber-600"
                  : hasAnySessions
                  ? "text-indigo-600"
                  : "text-slate-400"
              }`}
            >
              {hasAnySessions ? `${displayPercentage.toFixed(1)}%` : "--%"}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            {hasClosedSessions ? (
              <p>
                <strong>{stats.closedPresent}</strong> of{" "}
                <strong>{stats.closedTotal}</strong> closed sessions attended
                {stats.totalSessions > stats.closedTotal && (
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    +{stats.totalSessions - stats.closedTotal} ongoing session(s)
                  </span>
                )}
              </p>
            ) : hasAnySessions ? (
              <p>
                <strong>{stats.totalPresent}</strong> of{" "}
                <strong>{stats.totalSessions}</strong> practice session(s) attended
                <span className="block text-[11px] text-amber-600 mt-0.5 font-medium">
                  Official readiness locks once coach closes the session.
                </span>
              </p>
            ) : (
              <p className="text-slate-400">Calculated from closed sessions</p>
            )}
          </div>
        </div>

        {/* Card 2: Matches Played */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Matches Played
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  stats.matchCount >= 2
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {stats.matchCount >= 2 ? "Goal Met (≥2)" : "Need ≥2"}
              </span>
            </div>
            <p className="text-4xl font-black text-slate-900 mt-3">
              {stats.matchCount}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            {stats.matchCount >= 2 ? (
              <p className="text-emerald-700 font-medium">
                ✅ Minimum 2 matches requirement satisfied
              </p>
            ) : (
              <p className="text-slate-500">
                {2 - stats.matchCount} more match required for Scout eligibility
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Scout Trial Eligibility */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Scout Trial Eligibility
            </span>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl">{trialReady ? "🏆" : "⏳"}</span>
              <p
                className={`text-xl font-black ${
                  trialReady ? "text-emerald-700" : "text-amber-600"
                }`}
              >
                {trialReady ? "Trial Ready" : "In Progress"}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Attendance (≥75%):</span>
              <span
                className={`font-bold ${
                  isThresholdMet ? "text-emerald-700" : "text-slate-600"
                }`}
              >
                {hasClosedSessions
                  ? isThresholdMet
                    ? `${stats.closedPercent.toFixed(1)}% ✅`
                    : `${stats.closedPercent.toFixed(1)}% ❌`
                  : hasAnySessions
                  ? "Pending Closure ⏳"
                  : "0% ❌"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Matches (≥2):</span>
              <span
                className={`font-bold ${
                  stats.matchCount >= 2 ? "text-emerald-700" : "text-slate-600"
                }`}
              >
                {stats.matchCount >= 2
                  ? `${stats.matchCount} played ✅`
                  : `${stats.matchCount}/2 ❌`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Attendance History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              My Practice Session History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed log of sessions you attended and your attendance record.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {stats.totalSessions} Total Sessions
          </span>
        </div>

        {stats.totalSessions === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-3xl block mb-2">📋</span>
            <p className="text-sm font-semibold text-slate-700">
              No practice sessions recorded yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              When your coach creates a practice session for your sport, your
              attendance record will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date (IST)
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    My Attendance
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Session Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {stats.attendances.map((att) => {
                  const isPresent = att.status === "present";
                  const isClosed = att.session?.status === "closed";
                  const dateStr = att.session?.dateKey
                    ? formatISTDate(att.session.dateKey)
                    : "Unknown Date";

                  return (
                    <tr
                      key={String(att._id)}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900 block">
                          {dateStr}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {att.session?.dateKey}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                          {att.session?.sport?.name || sportName}
                        </span>
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
                          {isPresent ? "Present ✅" : "Absent ❌"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isClosed
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isClosed ? "🔒 Closed & Locked" : "🟢 Open"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Match History & Personal Scores Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              My Match History &amp; Personal Scores
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official match participation and your individual performance records.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {stats.matchScores.length} Matches Recorded
          </span>
        </div>

        {stats.matchScores.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-3xl block mb-2">⚽</span>
            <p className="text-sm font-semibold text-slate-700">
              No official match scores recorded yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              When you participate and record scores in academy matches, your
              individual performance records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Match Date (IST)
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Fixture
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    My Score
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {stats.matchScores.map((score) => {
                  const dateStr = score.match?.dateKey
                    ? formatISTDate(score.match.dateKey)
                    : "—";

                  return (
                    <tr
                      key={String(score._id)}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900 block">
                          {dateStr}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {score.match?.dateKey}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">
                          Dumka Academy vs {score.match?.opponent || "Opponent"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                          {score.match?.sport?.name || sportName}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {score.match?.location || (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {score.primaryScore}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        {(score.stats as { notes?: string })?.notes || (
                          <span className="text-slate-300 italic">—</span>
                        )}
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
