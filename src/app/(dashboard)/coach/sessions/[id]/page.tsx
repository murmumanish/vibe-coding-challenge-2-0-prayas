import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSessionWithAttendance } from "@/services/session.service";
import { AttendanceForm } from "@/components/AttendanceForm";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Attendance Sheet
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review auto-generated player attendance, mark present players, and lock
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
