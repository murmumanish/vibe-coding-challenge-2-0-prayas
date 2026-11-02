import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getAllSports } from "@/services/sport.service";
import { getAllSessions } from "@/services/session.service";
import { SessionsManager } from "@/components/SessionsManager";

export default async function CoachSessionsPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const [rawSports, rawSessions] = await Promise.all([
    getAllSports(true), // active sports only
    getAllSessions(),
  ]);

  const sports = JSON.parse(JSON.stringify(rawSports));
  const sessions = JSON.parse(JSON.stringify(rawSessions));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Link href="/coach" className="hover:text-indigo-600 transition">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Sessions</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Practice Sessions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Open daily practice sessions, record player attendance, and lock
            records.
          </p>
        </div>
      </div>

      <SessionsManager initialSessions={sessions} sports={sports} />
    </div>
  );
}
