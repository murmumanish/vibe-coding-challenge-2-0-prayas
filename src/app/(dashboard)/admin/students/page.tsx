// src/app/(dashboard)/admin/students/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllPlayers } from "@/services/player.service";
import { PlayersTable } from "@/components/PlayersTable";
import Link from "next/link";
import { AddIcon } from "@/components/Icons";

export default async function AdminStudentsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const rawPlayers = await getAllPlayers();
  const players = JSON.parse(JSON.stringify(rawPlayers));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Student &amp; Player Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Admin oversight: view enrolled students, filter by assigned sport discipline, and register new athletes.
          </p>
        </div>

        <Link
          href="/admin/students/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#ADD8E6] text-slate-900 hover:bg-[#9cd0e2] border border-[#96cce0] shadow-xs transition active:scale-95 self-start sm:self-auto"
        >
          <AddIcon className="w-4 h-4 text-slate-900" />
          <span>Enroll New Student</span>
        </Link>
      </div>

      <PlayersTable initialPlayers={players} readOnly={false} />
    </div>
  );
}
