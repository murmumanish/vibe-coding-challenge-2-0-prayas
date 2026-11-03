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
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <Link href="/coach" className="hover:text-blue-600 dark:hover:text-[#ADD8E6] transition">Dashboard</Link>
          <span>/</span>
          <Link href="/coach/players" className="hover:text-blue-600 dark:hover:text-[#ADD8E6] transition">Players</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">New</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Add New Player</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Register a player into the academy. Each player is assigned to exactly one sport.
        </p>
      </div>

      <PlayerForm />
    </div>
  );
}
