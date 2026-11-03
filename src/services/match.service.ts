// src/services/match.service.ts
import { dbConnect } from "@/lib/db";
import Match, { IMatch } from "@/models/Match";
import MatchScore, { IMatchScore } from "@/models/MatchScore";
import Session from "@/models/Session";
import Attendance from "@/models/Attendance";
import Sport from "@/models/Sport";
import Player from "@/models/Player";
import User from "@/models/User";
import { AppError } from "@/lib/errors";
import { canScoreMatch } from "@/domain/matchEligibility";
import { Types } from "mongoose";

export interface CreateMatchInput {
  dateKey: string;
  sportId: string;
  opponent: string;
  location?: string;
  createdBy: string;
}

export interface AddScoreInput {
  matchId: string;
  playerId: string;
  primaryScore: number;
  stats?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Creates an official match.
 */
export async function createMatch(data: CreateMatchInput): Promise<IMatch> {
  await dbConnect();

  const sport = await Sport.findById(data.sportId);
  if (!sport) {
    throw new AppError("Sport not found", 404);
  }
  if (!sport.isActive) {
    throw new AppError("Cannot create a match for an inactive sport", 400);
  }

  const match = await Match.create({
    dateKey: data.dateKey,
    sport: sport._id,
    opponent: data.opponent.trim(),
    location: data.location?.trim() || undefined,
    createdBy: new Types.ObjectId(data.createdBy),
  });

  return match;
}

/**
 * Gets all matches with optional filters and score counts.
 */
export async function getAllMatches(options?: {
  sportId?: string;
  dateKey?: string;
}) {
  await dbConnect();
  const filter: Record<string, unknown> = {};

  if (options?.sportId) {
    filter.sport = options.sportId;
  }
  if (options?.dateKey) {
    filter.dateKey = options.dateKey;
  }

  void User;
  const matches = await Match.find(filter)
    .populate("sport", "name slug isActive")
    .populate("createdBy", "name email")
    .sort({ dateKey: -1, createdAt: -1 })
    .lean();

  if (matches.length === 0) {
    return [];
  }

  const matchIds = matches.map((m) => m._id);
  const scoreCounts = await MatchScore.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    { $match: { match: { $in: matchIds } } },
    { $group: { _id: "$match", count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  for (const item of scoreCounts) {
    countMap.set(item._id.toString(), item.count);
  }

  return matches.map((m) => ({
    ...m,
    scoresCount: countMap.get(m._id.toString()) || 0,
  }));
}

/**
 * Gets a single match by ID.
 */
export async function getMatchById(id: string) {
  await dbConnect();
  const match = await Match.findById(id)
    .populate("sport", "name slug isActive")
    .populate("createdBy", "name email")
    .lean();

  if (!match) {
    throw new AppError("Match not found", 404);
  }

  return match;
}

/**
 * Gets match details along with recorded scores.
 */
export async function getMatchWithScores(id: string) {
  await dbConnect();
  const match = await getMatchById(id);

  const scores = await MatchScore.find({ match: id })
    .populate("player", "name age isActive sport")
    .populate("createdBy", "name email")
    .sort({ primaryScore: -1, createdAt: -1 })
    .lean();

  return { match, scores };
}

/**
 * Retrieves players who attended practice on the match day for this sport
 * and are therefore eligible to have scores recorded.
 */
export async function getEligiblePlayersForMatch(matchId: string) {
  await dbConnect();
  const match = await getMatchById(matchId);

  // 1. Find the practice session on the exact same date and sport
  const session = await Session.findOne({
    sport: (match.sport as { _id?: unknown })._id || match.sport,
    dateKey: match.dateKey,
  }).lean();

  if (!session) {
    return [];
  }

  // 2. Find players marked 'present' in that practice session
  const attendances = await Attendance.find({
    session: session._id,
    status: "present",
  })
    .populate("player", "name age isActive sport")
    .lean();

  // 3. Find already scored players in this match
  const existingScores = await MatchScore.find({ match: matchId })
    .select("player")
    .lean();
  const scoredPlayerIds = new Set(
    existingScores.map((s) => s.player.toString())
  );

  return attendances
    .filter((a) => a.player != null)
    .map((a) => {
      const p = a.player as any;
      const id = String(p._id || p.id || p);
      return {
        player: {
          _id: id,
          id,
          name: p.name || "Unknown Player",
          age: p.age || 0,
          isActive: p.isActive !== false,
          sport: p.sport,
        },
        alreadyScored: scoredPlayerIds.has(id),
      };
    });
}

/**
 * Records a player's score for a match.
 * Enforces strict eligibility:
 * - Must have attended a practice session for this exact sport on this exact dateKey.
 * - Attendance in that session must be 'present'.
 * - Rejects absent players, different sports, or missing sessions with 400.
 */
export async function addMatchScore(data: AddScoreInput): Promise<IMatchScore> {
  await dbConnect();

  const playerId = String(data.playerId || "").trim();
  if (!playerId) {
    throw new AppError("Player is required", 400);
  }

  // 1. Fetch match
  const match = await Match.findById(data.matchId);
  if (!match) {
    throw new AppError("Match not found", 404);
  }

  // 2. Fetch player
  const player = await Player.findById(playerId);
  if (!player) {
    throw new AppError("Player not found", 404);
  }

  // 3. Ensure player does not already have a score in this match
  const existingScore = await MatchScore.findOne({
    match: match._id,
    player: player._id,
  });
  if (existingScore) {
    throw new AppError(
      "A score for this player has already been recorded in this match",
      409
    );
  }

  // 4. Enforce proof of practice attendance eligibility
  const session = await Session.findOne({
    sport: match.sport,
    dateKey: match.dateKey,
  });

  if (!session) {
    throw new AppError(
      "Player is not eligible: No practice session was held for this sport on the match date",
      400
    );
  }

  const attendance = await Attendance.findOne({
    session: session._id,
    player: player._id,
  });

  if (!attendance) {
    throw new AppError(
      "Player is not eligible: Player has no attendance record for the match-day practice session",
      400
    );
  }

  const eligible = canScoreMatch(
    attendance.status,
    session.dateKey,
    session.sport.toString(),
    match.dateKey,
    match.sport.toString()
  );

  if (!eligible) {
    throw new AppError(
      "Player is not eligible: Player was absent or attendance does not match session sport and date",
      400
    );
  }

  // 5. Create MatchScore
  const score = await MatchScore.create({
    match: match._id,
    player: player._id,
    primaryScore: data.primaryScore,
    stats: data.stats,
    createdBy: new Types.ObjectId(data.createdBy),
  });

  if (typeof (score as any).populate === "function") {
    await (score as any).populate("player", "name age isActive sport");
  } else {
    (score as any).player = {
      _id: player._id.toString(),
      name: player.name,
      age: player.age,
      isActive: player.isActive,
      sport: player.sport,
    };
  }

  return score;
}
