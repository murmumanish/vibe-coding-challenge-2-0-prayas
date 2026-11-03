import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getMatchWithScores,
  getEligiblePlayersForMatch,
} from "@/services/match.service";
import { MatchScoreForm } from "@/components/MatchScoreForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachMatchDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const { id } = await params;

  let matchData;
  let eligiblePlayers;
  try {
    [matchData, eligiblePlayers] = await Promise.all([
      getMatchWithScores(id),
      getEligiblePlayersForMatch(id),
    ]);
  } catch {
    notFound();
  }

  const serializedMatch = JSON.parse(JSON.stringify(matchData.match));
  const serializedScores = JSON.parse(JSON.stringify(matchData.scores));
  const serializedEligibles = JSON.parse(JSON.stringify(eligiblePlayers));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Match Scores &amp; Verification
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Record verified match performance for players who satisfied practice
          attendance on the match date.
        </p>
      </div>

      <MatchScoreForm
        match={serializedMatch}
        initialScores={serializedScores}
        initialEligiblePlayers={serializedEligibles}
      />
    </div>
  );
}
