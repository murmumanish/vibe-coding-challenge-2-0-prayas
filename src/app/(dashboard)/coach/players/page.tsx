import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllPlayers } from "@/services/player.service";
import { getCoachAssignedSports } from "@/services/coach.service";
import { PlayersTable } from "@/components/PlayersTable";
import { AlertIcon } from "@/components/Icons";
import Link from "next/link";

export default async function CoachPlayersPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const [assignedSports, rawPlayers] = await Promise.all([
    getCoachAssignedSports(session.userId),
    getAllPlayers(),
  ]);

  const assignedSportIds = assignedSports.map((s) => s._id.toString());
  const scopedPlayers = rawPlayers.filter((p: any) =>
    assignedSportIds.includes(p.sport?._id?.toString() || p.sport?.toString())
  );

  const players = JSON.parse(JSON.stringify(scopedPlayers));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Players</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          View registered academy players in your assigned sports disciplines. Student enrollment and sport assignments are managed exclusively by the Academy Owner in the Admin Section.
        </p>
      </div>

      {assignedSports.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-6 text-center max-w-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center mb-3">
            <AlertIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            No Sports Assigned
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
            You do not currently have any sports disciplines assigned to your coach account. Ask the Academy Owner to assign sports in the Admin Section.
          </p>
          <div className="mt-4">
            <Link
              href="/coach"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] transition shadow-xs"
            >
              Back to Coach Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <PlayersTable initialPlayers={players} readOnly={true} showSportFilter={false} />
      )}
    </div>
  );
}
