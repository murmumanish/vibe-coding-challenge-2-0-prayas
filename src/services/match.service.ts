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
import { validateStats } from "@/domain/stats";
import { SPORT_PRESETS } from "@/domain/sportPresets";
import { Types } from "mongoose";
import { getScopedSportFilter } from "./serviceScope";

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

  // Validate coach is assigned to this sport if coach has assignedSports list
  if (data.createdBy && Types.ObjectId.isValid(data.createdBy)) {
    const coachUser = await User.findById(data.createdBy);
    if (coachUser?.assignedSports && coachUser.assignedSports.length > 0) {
      const isAssigned = coachUser.assignedSports.some(
        (id) => id.toString() === data.sportId
      );
      if (!isAssigned) {
        throw new AppError(
          "Forbidden: You are not assigned to record matches for this sport",
          403
        );
      }
    }
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

export interface MatchFilterOptions {
  sportId?: string;
  sport?: string;
  dateKey?: string;
  month?: string;
}

/**
 * Gets all matches with optional filters and score counts.
 * Caps at 200 items, sorted by { dateKey: -1, _id: -1 }.
 * Scoped by role:
 * - Coach: intersected with assigned sports.
 * - Player: server returns only matches where the player has a score row.
 */
export async function getAllMatches(
  options?: MatchFilterOptions,
  user?: { userId: string; role: string }
) {
  await dbConnect();
  const sportParam = options?.sport || options?.sportId;
  const { sportFilter, emptyResult } = await getScopedSportFilter(user, sportParam);

  if (emptyResult) {
    return [];
  }

  const filter: Record<string, unknown> = {};

  if (sportFilter) {
    filter.sport = sportFilter;
  }
  if (options?.dateKey) {
    filter.dateKey = options.dateKey;
  } else if (options?.month) {
    filter.dateKey = {
      $gte: `${options.month}-01`,
      $lte: `${options.month}-31`,
    };
  }

  let playerScoreMap: Map<string, { primaryScore: number; stats?: Record<string, unknown> }> | null = null;
  if (user?.role === "player") {
    const player = await Player.findOne({ userId: user.userId }).select("_id").lean();
    if (!player) {
      return [];
    }
    const scores = await MatchScore.find({ player: player._id })
      .select("match primaryScore stats")
      .lean();
    filter._id = { $in: scores.map((s) => s.match) };
    playerScoreMap = new Map();
    for (const sc of scores) {
      if (sc.match) {
        playerScoreMap.set(sc.match.toString(), {
          primaryScore: typeof sc.primaryScore === "number" ? sc.primaryScore : 0,
          stats: (sc.stats as Record<string, unknown>) || {},
        });
      }
    }
  }

  void User;
  const matches = await Match.find(filter)
    .populate("sport", "name slug isActive scoreFields")
    .populate("createdBy", "name email")
    .sort({ dateKey: -1, _id: -1 })
    .limit(200)
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

  return matches.map((m) => {
    if (m.sport && typeof m.sport === "object") {
      const s = m.sport as any;
      if (!s.scoreFields || s.scoreFields.length === 0) {
        const preset = SPORT_PRESETS.find(
          (p) =>
            p.slug === s.slug ||
            p.name.toLowerCase() === (s.name || "").toLowerCase()
        );
        if (preset) {
          s.scoreFields = preset.scoreFields;
          s.isPreset = true;
        }
      }
    }
    return {
      ...m,
      scoresCount: countMap.get(m._id.toString()) || 0,
      myScore: playerScoreMap ? playerScoreMap.get(m._id.toString()) || null : undefined,
    };
  });
}

/**
 * Returns available months with match counts and the earliest month.
 * Same role scoping as getAllMatches.
 */
export async function getMatchMonths(
  options?: { sport?: string; sportId?: string },
  user?: { userId: string; role: string }
): Promise<{ months: Array<{ month: string; count: number }>; earliestMonth: string | null }> {
  await dbConnect();
  const sportParam = options?.sport || options?.sportId;
  const { sportFilter, emptyResult } = await getScopedSportFilter(user, sportParam);

  if (emptyResult) {
    return { months: [], earliestMonth: null };
  }

  const matchFilter: Record<string, unknown> = {
    dateKey: { $type: "string", $regex: /^\d{4}-\d{2}-\d{2}$/ },
  };

  if (sportFilter) {
    matchFilter.sport = sportFilter;
  }

  if (user?.role === "player") {
    const player = await Player.findOne({ userId: user.userId }).select("_id").lean();
    if (!player) {
      return { months: [], earliestMonth: null };
    }
    const scores = await MatchScore.find({ player: player._id }).select("match").lean();
    matchFilter._id = { $in: scores.map((s) => s.match) };
  }

  const results = await Match.aggregate<{ _id: string; count: number }>([
    { $match: matchFilter },
    {
      $project: {
        month: { $substrCP: ["$dateKey", 0, 7] },
      },
    },
    {
      $group: {
        _id: "$month",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);

  const months = results.map((r) => ({
    month: r._id,
    count: r.count,
  }));

  const earliestMonth = months.length > 0 ? months[months.length - 1].month : null;

  return { months, earliestMonth };
}


/**
 * Gets a single match by ID.
 */
export async function getMatchById(id: string) {
  await dbConnect();
  const match = await Match.findById(id)
    .populate("sport", "name slug isActive scoreFields")
    .populate("createdBy", "name email")
    .lean();

  if (!match) {
    throw new AppError("Match not found", 404);
  }

  // Ensure sport.scoreFields is populated (backfill from preset if missing)
  if (match.sport && typeof match.sport === "object") {
    const s = match.sport as any;
    if (!s.scoreFields || s.scoreFields.length === 0) {
      const preset = SPORT_PRESETS.find(
        (p) =>
          p.slug === s.slug ||
          p.name.toLowerCase() === (s.name || "").toLowerCase()
      );
      if (preset) {
        s.scoreFields = preset.scoreFields;
        s.isPreset = true;
      }
    }
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
 * - Validates stats and primary score against sport scoreFields.
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

  // 5. Validate stats and primary score against sport scoreFields
  let sportDoc: any = null;
  if (match.sport && typeof match.sport === "object" && (match.sport as any).name) {
    sportDoc = match.sport;
  } else if (match.sport) {
    const sportQuery = Sport.findById(match.sport);
    sportDoc =
      sportQuery && typeof (sportQuery as any).lean === "function"
        ? await (sportQuery as any).lean()
        : await sportQuery;
  }

  let scoreFields = sportDoc?.scoreFields;
  if (!scoreFields || scoreFields.length === 0) {
    const slug = sportDoc?.slug;
    const name = sportDoc?.name;
    const preset = SPORT_PRESETS.find(
      (p) =>
        (slug && p.slug === slug) ||
        (name && p.name.toLowerCase() === name.toLowerCase())
    );
    if (preset) {
      scoreFields = preset.scoreFields;
      if (sportDoc?._id && typeof (Sport as any).findByIdAndUpdate === "function") {
        const updatePromise = Sport.findByIdAndUpdate(sportDoc._id, {
          scoreFields: preset.scoreFields,
          isPreset: true,
        });
        if (updatePromise && typeof (updatePromise as any).exec === "function") {
          (updatePromise as any).exec().catch(() => {});
        }
      }
    }
  }

  const statsPayload = {
    primaryScore: data.primaryScore,
    ...(data.stats || {}),
  };

  const validation = validateStats(scoreFields, statsPayload);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0] || "Invalid score";
    throw new AppError(firstError, 400);
  }

  const primaryScore = validation.primaryScore ?? data.primaryScore;
  const finalStats: Record<string, unknown> = { ...validation.validatedStats };
  if (
    typeof (data.stats as any)?.notes === "string" &&
    (data.stats as any).notes.trim()
  ) {
    finalStats.notes = (data.stats as any).notes.trim();
  }

  const statsToSave = data.stats !== undefined ? finalStats : undefined;

  // 6. Create MatchScore
  const score = await MatchScore.create({
    match: match._id,
    player: player._id,
    primaryScore,
    stats: statsToSave,
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

/**
 * Updates the dateKey of a match (for testing/corrections).
 */
export async function updateMatchDate(matchId: string, newDateKey: string) {
  await dbConnect();

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError("Match not found", 404);
  }

  match.dateKey = newDateKey;
  await match.save();

  return getMatchById(matchId);
}
