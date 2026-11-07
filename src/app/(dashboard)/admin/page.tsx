// src/app/(dashboard)/admin/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Sport from "@/models/Sport";
import Player from "@/models/Player";
import User from "@/models/User";
import Session from "@/models/Session";
import Match from "@/models/Match";
import { getReadinessRoster } from "@/services/readiness.service";
import Link from "next/link";
import {
  PeopleIcon,
  SportsIcon,
  ClipboardIcon,
  MatchIcon,
  StarIcon,
  AddIcon,
  StadiumIcon,
  WhistleIcon,
  ScoutIcon,
} from "@/components/Icons";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  await dbConnect();
  const [
    activeSportsCount,
    activePlayersCount,
    coachesCount,
    scoutsCount,
    totalSessionsCount,
    totalMatchesCount,
    readyPlayers,
    recentStudents,
  ] = await Promise.all([
    Sport.countDocuments({ isActive: true }),
    Player.countDocuments({ isActive: true }),
    User.countDocuments({ role: "coach", isActive: true }),
    User.countDocuments({ role: "scout", isActive: true }),
    Session.countDocuments(),
    Match.countDocuments(),
    getReadinessRoster({ readyOnly: true }),
    Player.find({ isActive: true })
      .populate("sport", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const readyCount = readyPlayers.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Academy Owner Header Banner */}
      <div className="rounded-2xl bg-[#ADD8E6] p-6 sm:p-8 shadow-sm relative overflow-hidden border border-blue-200">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/60 px-3 py-1 text-xs font-bold mb-3 border border-blue-300/60 text-slate-900 dark:text-white shadow-2xs">
            <StadiumIcon className="w-3.5 h-3.5 text-blue-800 dark:text-[#ADD8E6]" />
            <span>Academy Owner Portal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Welcome, Academy Owner!
          </h1>
          <p className="mt-2 max-w-2xl text-slate-700 text-xs sm:text-base leading-relaxed">
            Full authority over academy operations. Enroll students, configure sports disciplines &amp; scoring rubrics, and monitor academy coaching performance.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/students/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-transform active:scale-95"
            >
              <AddIcon className="w-4 h-4 text-white" />
              <span>Enroll New Student</span>
            </Link>
            <Link
              href="/admin/sports"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-900 hover:bg-slate-50 border border-slate-300 shadow-xs transition-transform active:scale-95"
            >
              <SportsIcon className="w-4 h-4 text-blue-700" />
              <span>Manage Sports Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Role Authority Info Notice */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 sm:p-5 flex items-start gap-3.5">
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold shrink-0 text-sm">
          ★
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Administrative Authority Policy
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            Only the Academy Owner possesses privileges to enroll students and add sports offerings. Coaches conduct training sessions, record matches, and mark attendance but cannot create students or sports.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Enrolled Students */}
        <Link
          href="/admin/students"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-all hover:border-[#ADD8E6] dark:hover:border-slate-700 hover:shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-[#ADD8E6] transition-colors">
              Enrolled Students
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {activePlayersCount}
          </p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Manage Directory &rarr;
          </span>
        </Link>

        {/* Active Sports */}
        <Link
          href="/admin/sports"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-all hover:border-[#ADD8E6] dark:hover:border-slate-700 hover:shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-[#ADD8E6] transition-colors">
              Sports Catalog
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {activeSportsCount}
          </p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Configure Catalog &rarr;
          </span>
        </Link>

        {/* Active Coaches */}
        <Link
          href="/admin/coaches"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-all hover:border-[#ADD8E6] dark:hover:border-slate-700 hover:shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-[#ADD8E6] transition-colors">
              Coaches
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {coachesCount}
          </p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Assign Sports &rarr;
          </span>
        </Link>

        {/* Practice Sessions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sessions
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalSessionsCount}
          </p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Total Conducted
          </span>
        </div>

        {/* Official Matches */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Matches
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalMatchesCount}
          </p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Recorded Scores
          </span>
        </div>

        {/* Trial-Ready Athletes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trial Ready
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {readyCount}
          </p>
          <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 block">
            Scout Qualified
          </span>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Admin Management Modules
        </h2>
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <AdminModuleCard
            IconComp={PeopleIcon}
            title="Student Enrollment & Directory"
            badge={`${activePlayersCount} students`}
            description="Register new students, assign primary sports, generate portal login credentials, and view profiles."
            href="/admin/students"
            cta="Manage Students"
            accent="blue"
          />

          <AdminModuleCard
            IconComp={SportsIcon}
            title="Sports Catalog & Scoring Metrics"
            badge={`${activeSportsCount} sports`}
            description="Add preset Olympic & regional sports, create custom sports, configure scoring fields, and manage status."
            href="/admin/sports"
            cta="Configure Sports"
            accent="purple"
          />

                    <AdminModuleCard
            IconComp={WhistleIcon}
            title="Coach Sports Assignment"
            badge={`${coachesCount} coaches`}
            description="Assign sports disciplines to coaches. A coach only sees and manages their assigned sports."
            href="/admin/coaches"
            cta="Assign Sports"
            accent="blue"
          />

<AdminModuleCard
            IconComp={StarIcon}
            title="Scouting & Trial Readiness"
            badge={`${readyCount} qualified`}
            description="Review athletes who have met minimum session attendance and match trial qualification criteria."
            href="/coach/ready"
            cta="Inspect Readiness"
            accent="emerald"
          />
          <AdminModuleCard
            IconComp={ScoutIcon}
            title="Scout Sports Assignment"
            badge={`${scoutsCount} scouts`}
            description="Create talent scout credentials and assign sports disciplines. Scouts only see trial-ready athletes in their assigned sports."
            href="/admin/scouts"
            cta="Assign Sports"
            accent="emerald"
          />
        </div>
      </div>

      {/* Recent Enrolled Students Preview */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] shadow-xs overflow-hidden transition-colors">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recently Enrolled Students
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Latest athletes registered into the academy.
            </p>
          </div>
          <Link
            href="/admin/students"
            className="text-xs font-bold text-blue-600 dark:text-[#ADD8E6] hover:underline"
          >
            View all &rarr;
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No students enrolled yet.{" "}
            <Link
              href="/admin/students/new"
              className="text-blue-600 dark:text-[#ADD8E6] underline font-bold"
            >
              Enroll the first student
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentStudents.map((s: any) => (
              <div
                key={s._id.toString()}
                className="px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#ADD8E6] text-slate-900 font-bold text-xs">
                    {s.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Age: {s.age} · Sport: {s.sport?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminModuleCard({
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
