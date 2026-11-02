// src/services/readiness.service.ts
import { dbConnect } from "@/lib/db";
import Player, { IPlayer } from "@/models/Player";
import Session from "@/models/Session";
import Attendance from "@/models/Attendance";
import MatchScore from "@/models/MatchScore";
import Sport from "@/models/Sport";
import { isReady } from "@/domain/readiness";
import { calculateAttendancePercentage } from "@/domain/attendance";

export interface PlayerReadinessItem {
  player: IPlayer;
  stats: {
    closedTotal: number;
    closedPresent: number;
    attendancePercent: number;
    matchCount: number;
    isReady: boolean;
  };
}

export interface ReadinessOptions {
  sportId?: string;
  readyOnly?: boolean;
}

/**
 * Calculates trial readiness for academy players.
 * Ready standard:
 * - Attendance in CLOSED sessions >= 75%
 * - At least 2 official matches played
 *
 * Scouts only receive players where isReady === true.
 * Coaches can view all players with their detailed readiness status.
 */
export async function getReadinessRoster(
  options?: ReadinessOptions
): Promise<PlayerReadinessItem[]> {
  await dbConnect();

  // Ensure models are registered for populate
  void Session;
  void Sport;

  const playerFilter: Record<string, unknown> = { isActive: true };
  if (options?.sportId) {
    playerFilter.sport = options.sportId;
  }

  const players = await Player.find(playerFilter)
    .populate("sport", "name slug isActive")
    .populate("userId", "email")
    .sort({ name: 1 })
    .lean();

  if (players.length === 0) {
    return [];
  }

  const results: PlayerReadinessItem[] = [];

  for (const player of players) {
    // 1. Fetch attendance records in closed sessions
    const rawAttendances = await Attendance.find({ player: player._id })
      .populate({
        path: "session",
        select: "status dateKey sport",
      })
      .lean();

    const closedAttendances = rawAttendances.filter(
      (a) => a.session && (a.session as { status?: string }).status === "closed"
    );

    const closedTotal = closedAttendances.length;
    const closedPresent = closedAttendances.filter(
      (a) => a.status === "present"
    ).length;
    const attendancePercent = calculateAttendancePercentage(
      closedPresent,
      closedTotal
    );

    // 2. Count official match scores for this player
    const matchCount = await MatchScore.countDocuments({ player: player._id });

    // 3. Evaluate domain readiness rule
    const ready = isReady(attendancePercent, matchCount);

    if (options?.readyOnly && !ready) {
      continue;
    }

    results.push({
      player: player as unknown as IPlayer,
      stats: {
        closedTotal,
        closedPresent,
        attendancePercent,
        matchCount,
        isReady: ready,
      },
    });
  }

  return results;
}
