import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllSports } from "@/services/sport.service";
import { getAllMatches } from "@/services/match.service";
import { MatchesManager } from "@/components/MatchesManager";

export default async function CoachMatchesPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const [rawSports, rawMatches] = await Promise.all([
    getAllSports(true),
    getAllMatches(),
  ]);

  const sports = JSON.parse(JSON.stringify(rawSports));
  const matches = JSON.parse(JSON.stringify(rawMatches));

  return <MatchesManager initialMatches={matches} sports={sports} />;
}
