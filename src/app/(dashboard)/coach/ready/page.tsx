import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReadinessRoster } from "@/services/readiness.service";
import { getCoachAssignedSports } from "@/services/coach.service";
import { ReadyTable } from "@/components/ReadyTable";
import Link from "next/link";
import { AlertIcon, StarIcon } from "@/components/Icons";

export default async function CoachReadyPlayersPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const [assignedSports, rawPlayers] = await Promise.all([
    getCoachAssignedSports(session.userId),
    getReadinessRoster({ readyOnly: true }),
  ]);

  const assignedSportIds = assignedSports.map((s) => s._id.toString());
  const scopedPlayers = rawPlayers.filter((p: any) => {
    const sportId =
      p.player?.sport?._id?.toString() ||
      p.player?.sport?.toString() ||
      p.sportId?.toString();
    return assignedSportIds.includes(sportId);
  });
  const players = JSON.parse(JSON.stringify(scopedPlayers));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary-container text-foreground">
              <StarIcon className="w-4 h-4 text-primary" />
            </span>
            <span>Trial-Ready Athletes</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-xs font-bold">
              {players.length} Qualified
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Athletes meeting scouting criteria (≥ 75% closed attendance &amp; ≥ 2 matches) in your assigned sports.
          </p>
        </div>
      </div>

      {assignedSports.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-6 text-center max-w-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center mb-3">
            <AlertIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            No Sports Assigned
          </h2>
          <p className="text-xs text-foreground/70 mt-1 max-w-md mx-auto">
            You do not currently have any sports disciplines assigned. Contact the Academy Owner to assign sports.
          </p>
          <div className="mt-4">
            <Link
              href="/coach"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover border border-card-border transition shadow-xs"
            >
              Back to Coach Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <ReadyTable initialPlayers={players} isScoutView={false} />
      )}
    </div>
  );
}
