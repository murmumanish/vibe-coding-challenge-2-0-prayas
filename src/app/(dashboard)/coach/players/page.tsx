import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllPlayers } from "@/services/player.service";
import { PlayersTable } from "@/components/PlayersTable";
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/coach" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span>Players</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Players Roster</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your academy&apos;s registered players.
          </p>
        </div>
        <Link
          href="/coach/players/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Add Player
        </Link>
      </div>

      <PlayersTable initialPlayers={players} />
    </div>
  );
}
