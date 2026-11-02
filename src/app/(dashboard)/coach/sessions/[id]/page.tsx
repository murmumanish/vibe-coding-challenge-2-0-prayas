import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSessionWithAttendance } from "@/services/session.service";
import { AttendanceForm } from "@/components/AttendanceForm";
import { formatISTDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachSessionDetailPage({ params }: PageProps) {
  const authSession = await getSession();
  if (!authSession || authSession.role !== "coach") {
    redirect("/login");
  }

  const { id } = await params;

  let sessionData;
  try {
    sessionData = await getSessionWithAttendance(id);
  } catch {
    notFound();
  }

  // Serialize Mongoose docs for Client Component
  const serialized = JSON.parse(JSON.stringify(sessionData));

  const sportName = serialized.session?.sport?.name || "Session";
  const dateFormatted = formatISTDate(serialized.session?.dateKey || "");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Link href="/coach" className="hover:text-indigo-600 transition">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/coach/sessions" className="hover:text-indigo-600 transition">
            Practice Sessions
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">
            {sportName} ({dateFormatted})
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Attendance Sheet
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review auto-generated roster attendance, mark present players, and lock
          the session when practice ends.
        </p>
      </div>

      <AttendanceForm
        session={serialized.session}
        initialAttendances={serialized.attendances}
      />
    </div>
  );
}
