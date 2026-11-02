// src/app/(dashboard)/coach/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Sport from "@/models/Sport";
import Player from "@/models/Player";
import Link from "next/link";

export default async function CoachDashboard() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  await dbConnect();
  const [activeSportsCount, activePlayersCount] = await Promise.all([
    Sport.countDocuments({ isActive: true }),
    Player.countDocuments({ isActive: true }),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-semibold mb-3">
            <span>🏟️</span> Dumka Academy Headquarters
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, Coach!
          </h1>
          <p className="mt-2 max-w-xl text-indigo-100 text-sm sm:text-base">
            Track practice sessions, record official match scores, and prepare trial-ready players for scouts.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 text-9xl select-none pointer-events-none translate-x-10 translate-y-6">
          🏆
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Sports</span>
          <p className="mt-2 text-3xl font-black text-slate-900">{activeSportsCount}</p>
          <span className="mt-1 text-xs text-slate-500">Configured in Academy</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Players</span>
          <p className="mt-2 text-3xl font-black text-slate-900">{activePlayersCount}</p>
          <span className="mt-1 text-xs text-slate-500">On Academy Roster</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Readiness Rule</span>
          <p className="mt-2 text-3xl font-black text-indigo-600">75%</p>
          <span className="mt-1 text-xs text-slate-500">Attendance + 2 Matches</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timezone</span>
          <p className="mt-2 text-2xl font-black text-slate-900">IST</p>
          <span className="mt-1 text-xs text-slate-500">UTC+05:30 (dateKey)</span>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Academy Modules</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            icon="👥"
            title="Players Roster"
            badge={`${activePlayersCount} active`}
            description="Register new players and manage roster status."
            href="/coach/players"
            cta="Manage Players"
            accent="blue"
          />
          <DashboardCard
            icon="⚙️"
            title="Sports Config"
            badge={`${activeSportsCount} active`}
            description="Manage sports offerings without hardcoded lists."
            href="/coach/sports"
            cta="Configure Sports"
            accent="indigo"
          />
          <DashboardCard
            icon="📋"
            title="Practice Sessions"
            badge="Lifecycle: Open → Close"
            description="Open daily sessions, mark attendance, and lock records."
            href="/coach/sessions"
            cta="Track Attendance"
            accent="purple"
          />
          <DashboardCard
            icon="⚽"
            title="Match Records"
            badge="Proof Required"
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
  icon,
  title,
  badge,
  description,
  href,
  cta,
  accent = "blue",
}: {
  icon: string;
  title: string;
  badge?: string;
  description: string;
  href: string;
  cta: string;
  accent?: string;
}) {
  const accentClasses: Record<string, string> = {
    blue: "hover:border-blue-400 group-hover:text-blue-600",
    indigo: "hover:border-indigo-400 group-hover:text-indigo-600",
    purple: "hover:border-purple-400 group-hover:text-purple-600",
    emerald: "hover:border-emerald-400 group-hover:text-emerald-600",
  };

  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all ${accentClasses[accent]}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-2xl group-hover:scale-110 transition-transform">
            {icon}
          </span>
          {badge && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
        <span>{cta}</span>
        <span className="ml-1">&rarr;</span>
      </div>
    </Link>
  );
}
