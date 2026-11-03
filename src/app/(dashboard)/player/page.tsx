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
import {
  AthleteIcon,
  SportsIcon,
  AlertIcon,
  CheckCircleIcon,
  TimeIcon,
  LockIcon,
  ClipboardIcon,
  MatchIcon,
  StarIcon,
  StadiumIcon,
} from "@/components/Icons";

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

  // Dynamic attendance color styling:
  // - Below 75%: Red (#f43f5e / rose-500)
  // - 100%: Full rich green (hsl(142, 80%, 42%))
  // - In between (75% to 99%): Interpolates smoothly from lime-green (72°) to pure green (142°)
  const attColor = (() => {
    if (!hasAnySessions) {
      return {
        textClass: "text-slate-400 dark:text-slate-500",
        barColor: "#94a3b8",
        badgeClass:
          "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
        badgeLabel: "No Sessions",
        isDynamic: false,
        textLight: "",
        textDark: "",
      };
    }

    if (displayPercentage < 75) {
      return {
        textClass: "text-rose-600 dark:text-rose-400",
        barColor: "#f43f5e",
        badgeClass:
          "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
        badgeLabel: "Below Target",
        isDynamic: false,
        textLight: "",
        textDark: "",
      };
    }

    // percentage >= 75%: interpolate from 75% (t=0) to 100% (t=1)
    const t = Math.min(1, Math.max(0, (displayPercentage - 75) / 25));
    // Hue from 72° (warm lime) to 142° (full emerald green)
    const hue = Math.round(72 + t * (142 - 72));

    const barColor = `hsl(${hue}, 82%, 44%)`;
    const textLight = `hsl(${hue}, 85%, 34%)`;
    const textDark = `hsl(${hue}, 85%, 48%)`;
    const isFull = displayPercentage >= 100;

    return {
      barColor,
      textLight,
      textDark,
      badgeClass: isFull
        ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-extrabold"
        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
      badgeLabel: isFull ? "100% Full Attendance" : "Target Met",
      isDynamic: true,
      textClass: "",
    };
  })();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Athlete Profile Hero Banner ── */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#ADD8E6] border border-blue-200 p-5 sm:p-7 text-slate-900 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
          {/* Top Chips Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold border border-blue-300/60 text-slate-900 shadow-xs">
              <AthleteIcon className="w-3.5 h-3.5 text-blue-800" />
              <span>Dumka Sports Academy &bull; Athlete Portal</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/80 text-slate-900 border border-blue-300/60">
                {sportName}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  player?.isActive
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-slate-200 text-slate-700 border border-slate-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    player?.isActive ? "bg-emerald-600" : "bg-slate-500"
                  }`}
                />
                {player?.isActive ? "Active Player" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Athlete Identity & Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <span className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white text-slate-900 border border-blue-200 font-black text-2xl shadow-xs shrink-0">
                {playerName.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  {playerName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                  {player?.age ? `${player.age} yrs &bull; ` : ""}
                  Registered: {session.email}
                </p>
              </div>
            </div>

            {/* Quick Scout Status Badge */}
            <div className="sm:self-center">
              {trialReady ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-900 shadow-xs">
                  <StarIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Qualified for Scout Trials</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/80 border border-blue-200 px-3.5 py-2 text-xs font-bold text-slate-900 shadow-xs">
                  <TimeIcon className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Trial Qualification in Progress</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unlinked Profile Notice if coach hasn't registered this account */}
      {!player && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <AlertIcon className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Player profile unlinked:</strong> Your login account is not
            associated with an active player record yet. Please ask your academy coach
            to add you as a player with email <strong>{session.email}</strong>.
          </span>
        </div>
      )}

      {/* ── 3 Key Performance Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Card 1: Practice Attendance Rate */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attendance Rate
              </span>
              {hasAnySessions ? (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${attColor.badgeClass}`}
                >
                  {attColor.badgeLabel}
                </span>
              ) : null}
            </div>

            <p
              className={`text-3xl sm:text-4xl font-black mt-3 ${
                attColor.isDynamic
                  ? "text-[color:var(--att-light)] dark:text-[color:var(--att-dark)]"
                  : attColor.textClass
              }`}
              style={
                attColor.isDynamic
                  ? ({
                      "--att-light": attColor.textLight,
                      "--att-dark": attColor.textDark,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {hasAnySessions ? `${displayPercentage.toFixed(1)}%` : "--%"}
            </p>

            {/* Visual Progress Bar with dynamic calculated color & 75% target line */}
            <div className="mt-3.5 space-y-1">
              <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, displayPercentage)}%`,
                    backgroundColor: attColor.barColor,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>0%</span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">Target: 75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {hasClosedSessions ? (
              <p>
                <strong className="text-slate-800 dark:text-slate-200">{stats.closedPresent}</strong> of{" "}
                <strong className="text-slate-800 dark:text-slate-200">{stats.closedTotal}</strong> practice sessions attended
                {stats.totalSessions > stats.closedTotal && (
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    +{stats.totalSessions - stats.closedTotal} ongoing session(s)
                  </span>
                )}
              </p>
            ) : hasAnySessions ? (
              <p>
                <strong className="text-slate-800 dark:text-slate-200">{stats.totalPresent}</strong> of{" "}
                <strong className="text-slate-800 dark:text-slate-200">{stats.totalSessions}</strong> practice session(s) attended
                <span className="block text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                  Official readiness locks once coach closes the session.
                </span>
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500">Practice attendance will record here</p>
            )}
          </div>
        </div>

        {/* Card 2: Matches Played */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matches Played
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  stats.matchCount >= 2
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {stats.matchCount >= 2 ? "Goal Met" : "Need 2"}
              </span>
            </div>

            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3">
              {stats.matchCount}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {stats.matchCount >= 2 ? (
              <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" /> Minimum 2 matches requirement satisfied
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                {2 - stats.matchCount} more match required for Scout eligibility
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Scout Trial Eligibility */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Scout Eligibility
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  trialReady
                    ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                }`}
              >
                {trialReady ? "Trial Ready" : "In Progress"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-2xl ${
                  trialReady
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                }`}
              >
                {trialReady ? (
                  <StarIcon className="w-6 h-6" />
                ) : (
                  <TimeIcon className="w-6 h-6" />
                )}
              </div>
              <div>
                <p
                  className={`text-lg sm:text-xl font-black ${
                    trialReady
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {trialReady ? "Trial-Ready Athlete" : "In Progress"}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {trialReady ? "Visible to scouting network" : "Complete requirements below"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              {isThresholdMet ? (
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <TimeIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span>Attendance</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              {stats.matchCount >= 2 ? (
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <TimeIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span>Matches</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Practice Attendance History Section ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              My Practice Session History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official attendance logs recorded by academy coaching staff.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            {stats.totalSessions} Sessions
          </span>
        </div>

        {stats.totalSessions === 0 ? (
          <div className="p-10 sm:p-12 text-center text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
              <ClipboardIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No practice sessions recorded yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1">
              When your coach conducts a practice session for {sportName}, your
              attendance records will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* ── Mobile View: Dedicated Session Cards (md:hidden) ── */}
            <div className="p-3.5 space-y-3 md:hidden">
              {stats.attendances.map((att) => {
                const isPresent = att.status === "present";
                const isClosed = att.session?.status === "closed";
                const dateStr = att.session?.dateKey
                  ? formatISTDate(att.session.dateKey)
                  : "Unknown Date";

                return (
                  <div
                    key={String(att._id)}
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 shadow-xs transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {dateStr}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {att.session?.sport?.name || sportName}
                        </span>
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

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 dark:text-slate-500">Session State</span>
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          isClosed
                            ? "text-slate-600 dark:text-slate-400"
                            : "text-emerald-600 dark:text-emerald-400 font-bold"
                        }`}
                      >
                        {isClosed ? (
                          <>
                            <LockIcon className="w-3 h-3 text-slate-400" /> Closed & Locked
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open Practice
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop View: Full Table (hidden md:block) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Session Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Sport
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      My Attendance
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Session Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#18202c] divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.attendances.map((att) => {
                    const isPresent = att.status === "present";
                    const isClosed = att.session?.status === "closed";
                    const dateStr = att.session?.dateKey
                      ? formatISTDate(att.session.dateKey)
                      : "Unknown Date";

                    return (
                      <tr
                        key={String(att._id)}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                            {dateStr}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {att.session?.sport?.name || sportName}
                          </span>
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

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isClosed
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            {isClosed ? (
                              <>
                                <LockIcon className="w-3 h-3 text-slate-500" /> Closed &amp; Locked
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open
                              </>
                            )}
                          </span>
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

      {/* ── My Match History & Personal Scores Section ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              My Match History &amp; Scores
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official academy tournament participation and verified player scores.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            {stats.matchScores.length} Matches
          </span>
        </div>

        {stats.matchScores.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ADD8E6]/25 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] flex items-center justify-center mb-3">
              <MatchIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No official match scores recorded yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1">
              When you participate in academy matches, coaches record your official score here for scout review.
            </p>
          </div>
        ) : (
          <>
            {/* ── Mobile View: Dedicated Match Cards (md:hidden) ── */}
            <div className="p-3.5 space-y-3 md:hidden">
              {stats.matchScores.map((score) => {
                const dateStr = score.match?.dateKey
                  ? formatISTDate(score.match.dateKey)
                  : "—";

                return (
                  <div
                    key={String(score._id)}
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 shadow-xs transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          Dumka Academy vs {score.match?.opponent || "Opponent"}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {dateStr}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {score.match?.sport?.name || sportName}
                      </span>
                    </div>

                    {/* Score Highlight Box */}
                    <div className="mt-3 p-3 rounded-xl bg-[#ADD8E6]/20 dark:bg-[#ADD8E6]/10 border border-blue-200/80 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        My Performance Score
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#18202c] shadow-xs border border-slate-200 dark:border-slate-700">
                        {score.primaryScore}
                      </span>
                    </div>

                    {/* Venue & Notes */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs">
                      {score.match?.location && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <StadiumIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Venue: {score.match.location}</span>
                        </div>
                      )}
                      {(score.stats as { notes?: string })?.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                          &ldquo;{(score.stats as { notes?: string }).notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop View: Full Table (hidden md:block) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Match Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Fixture
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Sport
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      My Score
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#18202c] divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.matchScores.map((score) => {
                    const dateStr = score.match?.dateKey
                      ? formatISTDate(score.match.dateKey)
                      : "—";

                    return (
                      <tr
                        key={String(score._id)}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                            {dateStr}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Dumka Academy vs {score.match?.opponent || "Opponent"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {score.match?.sport?.name || sportName}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {score.match?.location || (
                            <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-slate-700">
                            {score.primaryScore}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                          {(score.stats as { notes?: string })?.notes || (
                            <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                          )}
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
