// src/app/(dashboard)/coach/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Sport from "@/models/Sport";
import Player from "@/models/Player";
import Session from "@/models/Session";
import { getReadinessRoster } from "@/services/readiness.service";
import Link from "next/link";
import {
  StadiumIcon,
  PeopleIcon,
  SportsIcon,
  ClipboardIcon,
  MatchIcon,
  StarIcon,
} from "@/components/Icons";

export default async function CoachDashboard() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  await dbConnect();
  const [activeSportsCount, activePlayersCount, totalSessionsCount, readyPlayers] =
    await Promise.all([
      Sport.countDocuments({ isActive: true }),
      Player.countDocuments({ isActive: true }),
      Session.countDocuments(),
      getReadinessRoster({ readyOnly: true }),
    ]);

  const readyCount = readyPlayers.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-[#ADD8E6] p-6 sm:p-8 shadow-sm relative overflow-hidden border border-blue-200">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold mb-3 border border-blue-300/60 text-blue-950 shadow-xs">
            <StadiumIcon className="w-3.5 h-3.5 text-blue-800" />
            <span>Dumka Academy Headquarters</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Welcome back, Coach!
          </h1>
          <p className="mt-2 max-w-xl text-slate-700 text-xs sm:text-base leading-relaxed">
            Track daily practice sessions, record official match performance scores, and prepare trial-ready players for scouting teams.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link
              href="/coach/sessions"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-transform active:scale-95"
            >
              <ClipboardIcon className="w-4 h-4 text-white" />
              <span>Open Today&apos;s Session</span>
            </Link>
            <Link
              href="/coach/matches"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-900 hover:bg-slate-50 border border-slate-300/80 shadow-xs transition-transform active:scale-95"
            >
              <MatchIcon className="w-4 h-4 text-blue-700" />
              <span>Record Match Scores</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        {/* Active Sports */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Sports
            </span>
            <SportsIcon className="w-4 h-4 text-blue-500 dark:text-[#ADD8E6]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{activeSportsCount}</p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">Offered at Academy</span>
        </div>

        {/* Active Players */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Players
            </span>
            <PeopleIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{activePlayersCount}</p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">Registered in Academy</span>
        </div>

        {/* Practice Sessions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Practice Logs
            </span>
            <ClipboardIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{totalSessionsCount}</p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">Sessions Conducted</span>
        </div>

        {/* Trial-Ready Athletes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trial-Ready
            </span>
            <StarIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{readyCount}</p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">Qualified for Scouts</span>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Academy Modules
        </h2>
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            IconComp={PeopleIcon}
            title="Players"
            badge={`${activePlayersCount} active`}
            description="Register new players and manage player status."
            href="/coach/players"
            cta="Manage Players"
            accent="blue"
          />
          <DashboardCard
            IconComp={SportsIcon}
            title="Sports Config"
            badge={`${activeSportsCount} active`}
            description="Manage sports offerings and academy programs."
            href="/coach/sports"
            cta="Configure Sports"
            accent="blue"
          />
          <DashboardCard
            IconComp={ClipboardIcon}
            title="Practice Sessions"
            badge={`${totalSessionsCount} logged`}
            description="Open daily sessions, mark attendance, and lock records."
            href="/coach/sessions"
            cta="Track Attendance"
            accent="purple"
          />
          <DashboardCard
            IconComp={MatchIcon}
            title="Match Records"
            badge="Verified Scores"
            description="Record matches and player scores for present players."
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
