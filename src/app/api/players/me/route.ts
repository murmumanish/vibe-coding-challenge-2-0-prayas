// src/app/api/players/me/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Player from "@/models/Player";
import { getPlayerAttendanceStats } from "@/services/player.service";

export const GET = withHandler(async () => {
  const session = await requireRole("player");

  await dbConnect();
  const player = await Player.findOne({ userId: session.userId })
    .populate("sport", "name slug")
    .lean();

  if (!player) {
    throw new AppError("Player profile not found", 404);
  }

  const stats = await getPlayerAttendanceStats(player._id);

  return NextResponse.json({ player, stats });
});
