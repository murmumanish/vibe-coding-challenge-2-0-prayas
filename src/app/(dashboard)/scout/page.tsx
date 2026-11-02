import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReadinessRoster } from "@/services/readiness.service";
import { ReadyTable } from "@/components/ReadyTable";

export default async function ScoutDashboard() {
  const session = await getSession();
  if (!session || session.role !== "scout") {
    redirect("/login");
  }

  // Scouts strictly see ONLY players who satisfy readiness
  const rawPlayers = await getReadinessRoster({ readyOnly: true });
  const players = JSON.parse(JSON.stringify(rawPlayers));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-800 p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold mb-3">
            🔍 Talent Scout Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Trial-Ready Athletes
          </h1>
          <p className="mt-2 text-emerald-100 text-sm max-w-xl">
            Verified academy players who meet the strict trial standard:
            <strong> ≥75% closed session practice attendance</strong> AND at least{" "}
            <strong>2 official matches played</strong>.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 text-9xl select-none pointer-events-none translate-x-8 translate-y-6">
          🌟
        </div>
      </div>

      <ReadyTable initialPlayers={players} isScoutView={true} />
    </div>
  );
}
