import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PlayerForm } from "@/components/PlayerForm";
import Link from "next/link";

export default async function NewPlayerPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/coach" className="hover:underline">Dashboard</Link>
          <span>/</span>
          <Link href="/coach/players" className="hover:underline">Players</Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Player</h1>
        <p className="text-sm text-gray-600 mt-1">
          Register a player into the academy. Each player is assigned to exactly one sport.
        </p>
      </div>

      <PlayerForm />
    </div>
  );
}
