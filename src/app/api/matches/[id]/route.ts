// src/app/api/matches/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import {
  getMatchWithScores,
  getEligiblePlayersForMatch,
  updateMatchDate,
} from "@/services/match.service";

export const GET = withHandler(
  async (_request: Request, context?: unknown) => {
    await requireRole("coach");

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

export const PATCH = withHandler(
  async (request: Request, context?: unknown) => {
    await requireRole("coach");

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const body = await request.json();
    const { dateKey } = body;

    if (!dateKey || typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new AppError("Invalid date format. Expected YYYY-MM-DD", 400);
    }

    const updatedMatch = await updateMatchDate(id, dateKey);
    const eligiblePlayers = await getEligiblePlayersForMatch(id);

    return NextResponse.json({
      match: updatedMatch,
      eligiblePlayers,
      message: "Match date updated successfully",
    });
  }
);
