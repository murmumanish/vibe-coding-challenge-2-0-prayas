import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReadinessRoster } from "@/services/readiness.service";
import { ReadyTable } from "@/components/ReadyTable";
import { StarIcon } from "@/components/Icons";
import Link from "next/link";

export default async function CoachReadyPlayersPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  // Fetch verified trial-ready players
  const rawPlayers = await getReadinessRoster({ readyOnly: true });
  const players = JSON.parse(JSON.stringify(rawPlayers));

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        {/*<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <Link
            href="/coach"
            className="hover:text-blue-600 dark:hover:text-[#ADD8E6] transition"
          >
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            Trial-Ready
          </span>
        </div>*/}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Scout-Ready Athletes</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-xs font-bold">
                {/*<StarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />*/}
                {players.length} Qualified
              </span>
            </h1>
            {/*<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Academy athletes meeting official scouting criteria: ≥ 75% closed
              practice attendance and at least 2 verified matches.
            </p>*/}
          </div>
        </div>
      </div>

      <ReadyTable initialPlayers={players} isScoutView={false} />
    </div>
  );
}
