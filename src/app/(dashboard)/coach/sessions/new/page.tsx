import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllSports } from "@/services/sport.service";
import { SessionForm } from "@/components/SessionForm";
import Link from "next/link";

export default async function NewSessionPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const rawSports = await getAllSports(true);
  const sports = JSON.parse(JSON.stringify(rawSports));

  return (
    <div className="space-y-6">
      <div>
        {/*<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <Link
            href="/coach"
            className="hover:text-blue-600 dark:hover:text-[#ADD8E6] transition"
          >
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href="/coach/sessions"
            className="hover:text-blue-600 dark:hover:text-[#ADD8E6] transition"
          >
            Sessions
          </Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            New
          </span>
        </div>*/}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Open Practice Session
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Start a daily training session for any academy sport to track player attendance.
        </p>
      </div>

      <SessionForm sports={sports} />
    </div>
  );
}