import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Player from "@/models/Player";
import { getAllSessions, getSessionMonths } from "@/services/session.service";
import { getCurrentISTMonth } from "@/lib/monthUtils";
import { PlayerSessionHistory } from "@/components/PlayerSessionHistory";

interface PageProps {
  searchParams?: Promise<{ month?: string }>;
}

export default async function PlayerSessionsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "player") {
    redirect("/login");
  }

  const { month } = (await searchParams) || {};
  const currentMonth = getCurrentISTMonth();
  const targetMonth = month || currentMonth;

  await dbConnect();
  const player = await Player.findOne({ userId: session.userId })
    .populate("sport", "name slug")
    .lean();

  const sportName =
    (player?.sport as unknown as { name?: string })?.name || "Assigned Sport";

  const [scopedSessions, monthsData] = await Promise.all([
    getAllSessions({ month: targetMonth }, session),
    getSessionMonths({}, session),
  ]);

  const sessions = JSON.parse(JSON.stringify(scopedSessions));
  const months = JSON.parse(JSON.stringify(monthsData.months));

  return (
    <PlayerSessionHistory
      initialMonth={targetMonth}
      initialSessions={sessions}
      initialMonths={months}
      earliestMonth={monthsData.earliestMonth}
      sportName={sportName}
    />
  );
}
