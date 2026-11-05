import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllPlayers } from "@/services/player.service";
import { PlayersTable } from "@/components/PlayersTable";

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
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Players</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your academy&apos;s registered players and view player profiles.
        </p>
      </div>

      <PlayersTable initialPlayers={players} />
    </div>
  );
}
