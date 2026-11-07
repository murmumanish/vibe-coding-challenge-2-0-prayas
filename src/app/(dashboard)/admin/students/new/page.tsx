// src/app/(dashboard)/admin/students/new/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PlayerForm } from "@/components/PlayerForm";
import Link from "next/link";

export default async function AdminNewStudentPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <Link href="/admin" className="hover:text-blue-600 dark:hover:text-[#ADD8E6] transition">Admin</Link>
          <span>/</span>
          <Link href="/admin/students" className="hover:text-blue-600 dark:hover:text-[#ADD8E6] transition">Students</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">New</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Enroll New Student
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Academy Owner authority: Register an athlete into the academy, assign their primary sport discipline, and optionally generate student login credentials.
        </p>
      </div>

      <PlayerForm redirectTo="/admin/students" />
    </div>
  );
}
