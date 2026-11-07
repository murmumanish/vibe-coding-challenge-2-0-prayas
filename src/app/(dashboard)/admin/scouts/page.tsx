// src/app/(dashboard)/admin/scouts/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllScouts } from "@/services/scout.service";
import { getAllSports } from "@/services/sport.service";
import { ScoutAssignmentManager } from "@/components/ScoutAssignmentManager";
import { ScoutIcon } from "@/components/Icons";

export default async function AdminScoutsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [rawScouts, rawSports] = await Promise.all([
    getAllScouts(),
    getAllSports(true),
  ]);

  const scouts = JSON.parse(JSON.stringify(rawScouts));
  const sports = JSON.parse(JSON.stringify(rawSports));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary-container text-foreground font-bold">
            <ScoutIcon className="w-4 h-4 text-foreground" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Scout Sports Assignment
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          Create talent scout login credentials and assign authorized sports disciplines. A scout strictly accesses and views trial-ready athletes within their assigned sports.
        </p>
      </div>

      <ScoutAssignmentManager initialScouts={scouts} sports={sports} />
    </div>
  );
}
