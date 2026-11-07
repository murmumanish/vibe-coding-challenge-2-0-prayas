import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCoachAssignedSports } from "@/services/coach.service";
import { getAllSessions } from "@/services/session.service";
import { SessionsManager } from "@/components/SessionsManager";
import { getCurrentISTMonth } from "@/lib/monthUtils";

interface PageProps {
  searchParams?: Promise<{ month?: string; sport?: string }>;
}

export default async function CoachSessionsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const { month, sport } = (await searchParams) || {};
  const currentMonth = getCurrentISTMonth();
  const targetMonth = month || currentMonth;

  const [rawAssignedSports, scopedSessions] = await Promise.all([
    getCoachAssignedSports(session.userId),
    getAllSessions({ month: targetMonth, sport }, session),
  ]);

  const sports = JSON.parse(JSON.stringify(rawAssignedSports));
  const sessions = JSON.parse(JSON.stringify(scopedSessions));

  return <SessionsManager initialSessions={sessions} sports={sports} />;
}
