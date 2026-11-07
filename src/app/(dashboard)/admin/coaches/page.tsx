// src/app/(dashboard)/admin/coaches/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllCoaches } from "@/services/coach.service";
import { getAllSports } from "@/services/sport.service";
import { CoachAssignmentManager } from "@/components/CoachAssignmentManager";
import { WhistleIcon } from "@/components/Icons";

export default async function AdminCoachesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [rawCoaches, rawSports] = await Promise.all([
    getAllCoaches(),
    getAllSports(true),
  ]);

  const coaches = JSON.parse(JSON.stringify(rawCoaches));
  const sports = JSON.parse(JSON.stringify(rawSports));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary-container text-foreground font-bold">
            <WhistleIcon className="w-4 h-4 text-foreground" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Coach Sports Assignment
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          Assign sports disciplines to academy coaches. A coach only sees and manages their assigned sports in their coach dashboard and sessions. Coaches have zero authority to change or configure sports.
        </p>
      </div>

      <CoachAssignmentManager initialCoaches={coaches} sports={sports} />
    </div>
  );
}
