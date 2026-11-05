import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReadinessRoster } from "@/services/readiness.service";
import { ReadyTable } from "@/components/ReadyTable";
import { ScoutIcon, StarIcon } from "@/components/Icons";

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
      <div className="rounded-3xl bg-[#ADD8E6] border border-blue-200 p-6 sm:p-8 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold mb-3 border border-blue-300/60 text-slate-900 shadow-xs">
            <ScoutIcon className="w-3.5 h-3.5 text-blue-800" /> Talent Scout Portal
          </span>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Trial-Ready Athletes
          </h1>
          <p className="mt-2 text-slate-700 text-xs sm:text-sm max-w-xl leading-relaxed">
            Verified academy players who meet the strict trial standard:{" "}
            {/*<strong>≥ 75% closed session practice attendance</strong> AND at least{" "}
            <strong>2 official matches played</strong>.*/}
          </p>
        </div>
      </div>

      <ReadyTable initialPlayers={players} isScoutView={true} />
    </div>
  );
}
