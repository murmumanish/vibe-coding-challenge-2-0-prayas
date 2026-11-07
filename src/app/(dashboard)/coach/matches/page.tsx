import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCoachAssignedSports } from "@/services/coach.service";
import { getAllMatches } from "@/services/match.service";
import { MatchesManager } from "@/components/MatchesManager";
import { getCurrentISTMonth } from "@/lib/monthUtils";

interface PageProps {
  searchParams?: Promise<{ month?: string; sport?: string }>;
}

export default async function CoachMatchesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const { month, sport } = (await searchParams) || {};
  const currentMonth = getCurrentISTMonth();
  const targetMonth = month || currentMonth;

  const [rawAssignedSports, scopedMatches] = await Promise.all([
    getCoachAssignedSports(session.userId),
    getAllMatches({ month: targetMonth, sport }, session),
  ]);

  const sports = JSON.parse(JSON.stringify(rawAssignedSports));
  const matches = JSON.parse(JSON.stringify(scopedMatches));

  return <MatchesManager initialMatches={matches} sports={sports} />;
}
