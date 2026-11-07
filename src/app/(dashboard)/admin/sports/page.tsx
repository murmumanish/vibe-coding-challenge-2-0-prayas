// src/app/(dashboard)/admin/sports/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SportManager } from "@/components/SportManager";

export default async function AdminSportsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Sports Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Academy Owner authority: install standard presets, define custom scoring metrics, and manage sports catalog status.
        </p>
      </div>

      <SportManager readOnly={false} />
    </div>
  );
}
