// src/app/api/matches/[id]/scores/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { createMatchScoreSchema } from "@/lib/validators";
import { addMatchScore } from "@/services/match.service";

export const POST = withHandler(
  async (request: Request, context?: unknown) => {
    const authUser = await requireRole("coach");
    const { params } = context as { params: Promise<{ id: string }> };
    const { id: matchId } = await params;

    const body = await request.json();
    const parsed = createMatchScoreSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message || "Invalid score input",
        400
      );
    }

    const playerId = parsed.data.playerId || parsed.data.player;
    if (!playerId) {
      throw new AppError("Player is required", 400);
    }

    const primaryScore =
      parsed.data.primaryScore !== undefined
        ? parsed.data.primaryScore
        : parsed.data.score;

    if (primaryScore === undefined || isNaN(Number(primaryScore))) {
      throw new AppError("Primary score is required", 400);
    }

    const score = await addMatchScore({
      matchId,
      playerId,
      primaryScore: Number(primaryScore),
      stats: parsed.data.stats,
      createdBy: authUser.userId,
    });

    return NextResponse.json({ score }, { status: 201 });
  }
);
