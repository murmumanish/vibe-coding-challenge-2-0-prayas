import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCoachAssignedSports } from "@/services/coach.service";
import { SessionForm } from "@/components/SessionForm";
import Link from "next/link";
import { AlertIcon } from "@/components/Icons";

export default async function NewSessionPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const rawSports = await getCoachAssignedSports(session.userId);
  const sports = JSON.parse(JSON.stringify(rawSports));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground">
          Open Practice Session
        </h1>
        <p className="text-xs sm:text-sm text-foreground opacity-70 mt-0.5">
          Start a daily training session for your assigned sport to track player attendance.
        </p>
      </div>

      {sports.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-6 text-center max-w-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center mb-3">
            <AlertIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            No Sports Assigned
          </h2>
          <p className="text-xs text-foreground opacity-80 mt-1 max-w-md mx-auto">
            You do not currently have any sports disciplines assigned to your coach account. Please contact the Academy Owner to assign sports in the Admin Section before opening a session.
          </p>
          <div className="mt-4">
            <Link
              href="/coach/sessions"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover transition shadow-xs"
            >
              Back to Sessions
            </Link>
          </div>
        </div>
      ) : (
        <SessionForm sports={sports} />
      )}
    </div>
  );
}
