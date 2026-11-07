import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Player from "@/models/Player";
import { getAllMatches, getMatchMonths } from "@/services/match.service";
import { getCurrentISTMonth } from "@/lib/monthUtils";
import { PlayerMatchHistory } from "@/components/PlayerMatchHistory";

interface PageProps {
  searchParams?: Promise<{ month?: string }>;
}

export default async function PlayerMatchesPage({ searchParams }: PageProps) {
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

  const [scopedMatches, monthsData] = await Promise.all([
    getAllMatches({ month: targetMonth }, session),
    getMatchMonths({}, session),
  ]);

  const matches = JSON.parse(JSON.stringify(scopedMatches));
  const months = JSON.parse(JSON.stringify(monthsData.months));

  return (
    <PlayerMatchHistory
      initialMonth={targetMonth}
      initialMatches={matches}
      initialMonths={months}
      earliestMonth={monthsData.earliestMonth}
      sportName={sportName}
    />
  );
}
