import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllPlayers } from "@/services/player.service";
import { PlayersTable } from "@/components/PlayersTable";
import { AddIcon } from "@/components/Icons";
import Link from "next/link";

export default async function CoachPlayersPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const rawPlayers = await getAllPlayers();
  // Serialize Mongo documents for Client Component
  const players = JSON.parse(JSON.stringify(rawPlayers));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Players</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your academy&apos;s registered players and status.
          </p>
        </div>
        <Link
          href="/coach/players/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ADD8E6] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 border border-[#96cce0] shadow-xs hover:bg-[#9cd0e2] active:bg-[#8cc4d8] active:scale-95 transition"
        >
          <AddIcon className="w-4 h-4" /> Add Player
        </Link>
      </div>

      <PlayersTable initialPlayers={players} />
    </div>
  );
}
