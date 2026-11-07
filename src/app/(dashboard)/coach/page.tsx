// src/app/(dashboard)/coach/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Player from "@/models/Player";
import Session from "@/models/Session";
import { getReadinessRoster } from "@/services/readiness.service";
import Link from "next/link";
import {
  PeopleIcon,
  ClipboardIcon,
  MatchIcon,
  SportsIcon,
  AlertIcon,
} from "@/components/Icons";

export default async function CoachDashboard() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  await dbConnect();

  // Fetch coach and their assigned sports
  const coachUser = await User.findById(session.userId)
    .populate("assignedSports", "name slug isActive")
    .lean();

  const assignedSports = ((coachUser?.assignedSports as any[]) || []).filter(
    (s) => s && s.isActive !== false
  );
  const assignedSportIds = assignedSports.map((s) => s._id);

  const playerFilter: Record<string, unknown> = { isActive: true };
  const sessionFilter: Record<string, unknown> = {};

  if (assignedSportIds.length > 0) {
    playerFilter.sport = { $in: assignedSportIds };
    sessionFilter.sport = { $in: assignedSportIds };
  } else {
    // If no sports assigned, coach has 0 players and 0 sessions
    playerFilter.sport = { $in: [] };
    sessionFilter.sport = { $in: [] };
  }

  const [activePlayersCount, totalSessionsCount, allReadyPlayers] =
    await Promise.all([
      Player.countDocuments(playerFilter),
      Session.countDocuments(sessionFilter),
      getReadinessRoster({ readyOnly: true }),
    ]);

  const assignedSportIdStrs = assignedSportIds.map((id) => id.toString());
  const readyPlayers = allReadyPlayers.filter((p: any) => {
    const sportId =
      p.player?.sport?._id?.toString() ||
      p.player?.sport?.toString() ||
      p.sportId?.toString();
    return assignedSportIdStrs.includes(sportId);
  });
  const readyCount = readyPlayers.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-[#ADD8E6] p-6 sm:p-8 shadow-sm relative overflow-hidden border border-blue-200">
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Welcome back, Coach!
          </h1>
          <p className="mt-2 max-w-xl text-slate-700 text-xs sm:text-base leading-relaxed">
            Conduct daily training sessions, mark player attendance, record official match scores, and track trial-ready athletes.
          </p>
        </div>
      </div>

      {/* Assigned Sports Section (Read-Only) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#ADD8E6] text-slate-900 border border-blue-200 font-bold">
                <SportsIcon className="w-4 h-4 text-slate-900" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Assigned Sports
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authorized sports disciplines assigned by Academy Owner. Coaches have read-only access and cannot change sports.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 self-start sm:self-auto">
            <span>{assignedSports.length} Discipline{assignedSports.length === 1 ? "" : "s"} Assigned</span>
          </span>
        </div>

        {assignedSports.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-2">
              <AlertIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No sports assigned yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
              Please contact the Academy Owner to assign sports to your coach profile in the Admin Section.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
            {assignedSports.map((sport: any) => (
              <div
                key={sport._id.toString()}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#ADD8E6] text-slate-900 font-bold text-xs shrink-0">
                  {sport.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {sport.name}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    Assigned &bull; Read-Only
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Active Players */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Players
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{activePlayersCount}</p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">In Assigned Sports</span>
        </div>

        {/* Practice Sessions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Practice Logs
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalSessionsCount}</p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">Sessions Conducted</span>
        </div>

        {/* Trial-Ready Athletes Card */}
        <Link
          href="/coach/ready"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md flex flex-col justify-between group active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Trial Ready
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {readyCount}
            </p>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Qualified for Scouts
          </span>
        </Link>

        {/* Create Session Section Card */}
        <Link
          href="/coach/sessions/new"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-all hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              New Session
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center justify-between">
            <span>Session</span>
          </p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Start Daily Practice
          </span>
        </Link>
      </div>

      {/* Primary Actions Grid */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Coach Modules
        </h2>
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3">
          <DashboardCard
            IconComp={PeopleIcon}
            title="Player Roster"
            badge={`${activePlayersCount} active`}
            description="View registered academy players and performance profiles in your assigned sports."
            href="/coach/players"
            cta="View Players"
            accent="blue"
          />
          <DashboardCard
            IconComp={ClipboardIcon}
            title="Practice Sessions"
            badge={`${totalSessionsCount} logged`}
            description="Open daily sessions, mark attendance, and lock records for your assigned sports."
            href="/coach/sessions"
            cta="Track Attendance"
            accent="purple"
          />
          <DashboardCard
            IconComp={MatchIcon}
            title="Match Records"
            badge="Verified Scores"
            description="Record matches and player scores for present players in your assigned sports."
            href="/coach/matches"
            cta="Record Matches"
            accent="emerald"
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  IconComp,
  title,
  badge,
  description,
  href,
  cta,
  accent = "blue",
}: {
  IconComp: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  description: string;
  href: string;
  cta: string;
  accent?: string;
}) {
  const accentClasses: Record<string, string> = {
    blue: "hover:border-[#ADD8E6] dark:hover:border-blue-400 group-hover:text-blue-600 dark:group-hover:text-[#ADD8E6]",
    purple: "hover:border-purple-400 dark:hover:border-purple-600 group-hover:text-purple-600 dark:group-hover:text-purple-400",
    emerald: "hover:border-emerald-400 dark:hover:border-emerald-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  };

  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs hover:shadow-md transition-all ${accentClasses[accent]}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
            <IconComp className="w-6 h-6" />
          </span>
          {badge && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#ADD8E6] transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center text-xs font-bold text-slate-800 dark:text-[#ADD8E6] group-hover:translate-x-1 transition-transform">
        <span>{cta}</span>
        <span className="ml-1">&rarr;</span>
      </div>
    </Link>
  );
}
