import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  getMatchWithScores,
  getEligiblePlayersForMatch,
} from "@/services/match.service";
import { MatchScoreForm } from "@/components/MatchScoreForm";
import { formatISTDate } from "@/lib/utils";

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

  const sportName = serializedMatch.sport?.name || "Sport";
  const dateStr = formatISTDate(serializedMatch.dateKey || "");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Link href="/coach" className="hover:text-indigo-600 transition">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/coach/matches" className="hover:text-indigo-600 transition">
            Matches
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">
            Dumka Academy vs {serializedMatch.opponent} ({sportName} • {dateStr})
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Match Scores & Verification
        </h1>
        <p className="text-xs text-slate-500 mt-1">
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
