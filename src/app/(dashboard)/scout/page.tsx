import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReadinessRoster } from "@/services/readiness.service";
import { getScoutAssignedSports } from "@/services/scout.service";
import { ReadyTable } from "@/components/ReadyTable";
import { ScoutIcon, SportsIcon, AlertIcon } from "@/components/Icons";

export default async function ScoutDashboard() {
  const session = await getSession();
  if (!session || session.role !== "scout") {
    redirect("/login");
  }

  // Scouts strictly see ONLY players who satisfy readiness within their assigned sports
  const [assignedSports, rawPlayers] = await Promise.all([
    getScoutAssignedSports(session.userId),
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
      <div className="rounded-3xl bg-primary-container border border-card-border p-6 sm:p-8 text-foreground shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-xs font-bold mb-3 border border-card-border text-foreground shadow-2xs">
            <ScoutIcon className="w-3.5 h-3.5 text-primary" /> Talent Scout Portal
          </span>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-foreground">
            Trial-Ready Athletes
          </h1>
          <p className="mt-2 text-foreground/80 text-xs sm:text-sm max-w-xl leading-relaxed">
            Verified academy players who meet the strict trial standard: ≥ 75% attendance in closed training sessions and at least 2 official matches played.
          </p>

          {/* Assigned Sports Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground/70 flex items-center gap-1">
              <SportsIcon className="w-3.5 h-3.5" />
              Your Assigned Sports:
            </span>
            {assignedSports.length === 0 ? (
              <span className="text-xs italic text-amber-700 dark:text-amber-300 font-medium">
                None assigned yet
              </span>
            ) : (
              assignedSports.map((s) => (
                <span
                  key={s._id.toString()}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-card border border-card-border text-foreground shadow-2xs"
                >
                  {s.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {assignedSports.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-6 sm:p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center mb-3">
            <AlertIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">No Sports Assigned</h2>
          <p className="text-xs text-foreground/70 mt-1 max-w-md mx-auto">
            You do not currently have any sport disciplines assigned to your scout account. Please contact the Academy Owner to assign sports to your profile.
          </p>
        </div>
      ) : (
        <ReadyTable initialPlayers={players} isScoutView={true} />
      )}
    </div>
  );
}
