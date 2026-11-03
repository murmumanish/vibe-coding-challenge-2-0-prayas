import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SportManager } from "@/components/SportManager";

export default async function CoachSportsPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Manage Sports</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Dynamic sports catalog: configure sports offerings, or archive existing ones to preserve historical logs.
        </p>
      </div>

      <SportManager />
    </div>
  );
}
