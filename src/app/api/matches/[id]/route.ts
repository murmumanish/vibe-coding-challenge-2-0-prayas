// src/app/api/matches/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler } from "@/lib/errors";
import { getSession } from "@/lib/auth";
import {
  getMatchWithScores,
  getEligiblePlayersForMatch,
} from "@/services/match.service";

export const GET = withHandler(
  async (_request: Request, context?: unknown) => {
    const session = await getSession();
    if (!session) {
      throw new Error("UNAUTHORIZED");
    }

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const [matchData, eligiblePlayers] = await Promise.all([
      getMatchWithScores(id),
      getEligiblePlayersForMatch(id),
    ]);

    return NextResponse.json({
      match: matchData.match,
      scores: matchData.scores,
      eligiblePlayers,
    });
  }
);
