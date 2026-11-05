// src/services/player.service.ts
import { dbConnect } from "@/lib/db";
import Player, { IPlayer } from "@/models/Player";
import Sport from "@/models/Sport";
import User from "@/models/User";
import Session from "@/models/Session";
import Attendance from "@/models/Attendance";
import Match from "@/models/Match";
import MatchScore from "@/models/MatchScore";
import { hashPassword } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { Types } from "mongoose";

export interface CreatePlayerInput {
  name: string;
  age: number;
  sportId: string;
  phone?: string;
  email?: string;
  password?: string;
}

export async function getAllPlayers(options?: {
  sportId?: string;
  activeOnly?: boolean;
}) {
  await dbConnect();
  const filter: Record<string, unknown> = {};

  if (options?.activeOnly) {
    filter.isActive = true;
  }
  if (options?.sportId) {
    filter.sport = options.sportId;
  }

  return Player.find(filter)
    .populate("sport", "name slug isActive")
    .populate("userId", "email")
    .sort({ name: 1 })
    .lean();
}

export async function getPlayerById(id: string) {
  await dbConnect();
  const player = await Player.findById(id)
    .populate("sport", "name slug isActive")
    .populate("userId", "email")
    .lean();
  if (!player) {
    throw new AppError("Player not found", 404);
  }
  return player;
}

export async function createPlayer(data: CreatePlayerInput): Promise<IPlayer> {
  await dbConnect();

  const sport = await Sport.findById(data.sportId);
  if (!sport || !sport.isActive) {
    throw new AppError("Invalid or inactive sport selected", 400);
  }

  let userObjectId: Types.ObjectId | undefined = undefined;

  // Option 1: Create student login account if email is provided
  if (data.email && data.email.trim()) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }

    if (!data.password || data.password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await User.create({
      name: data.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "player",
      isActive: true,
    });
    userObjectId = user._id;
  }

  return Player.create({
    name: data.name.trim(),
    age: data.age,
    sport: sport._id,
    phone: data.phone?.trim() || undefined,
    userId: userObjectId,
    isActive: true,
  });
}

export async function togglePlayerActive(id: string): Promise<IPlayer> {
  await dbConnect();
  const player = await Player.findById(id);
  if (!player) {
    throw new AppError("Player not found", 404);
  }

  player.isActive = !player.isActive;
  await player.save();

  // If player has linked user, sync their active status
  if (player.userId) {
    await User.findByIdAndUpdate(player.userId, { isActive: player.isActive });
  }

  return player;
}

export interface PlayerMatchScoreItem {
  _id: unknown;
  primaryScore: number;
  stats?: Record<string, unknown>;
  match: {
    _id: unknown;
    dateKey: string;
    opponent: string;
    location?: string;
    sport?: {
      _id: unknown;
      name: string;
      slug: string;
    };
  };
  createdAt: Date;
}

export interface PlayerAttendanceStats {
  closedTotal: number;
  closedPresent: number;
  closedPercent: number;
  totalSessions: number;
  totalPresent: number;
  totalPercent: number;
  matchCount: number;
  attendances: Array<{
    _id: unknown;
    status: "present" | "absent";
    session: {
      _id: unknown;
      dateKey: string;
      status: "open" | "closed";
      closedAt?: Date;
      sport?: {
        _id: unknown;
        name: string;
        slug: string;
      };
    };
    createdAt: Date;
  }>;
  matchScores: PlayerMatchScoreItem[];
}

export async function getPlayerAttendanceStats(
  playerId: string | Types.ObjectId
): Promise<PlayerAttendanceStats> {
  await dbConnect();

  // Ensure models are registered for populate
  void Session;
  void Sport;
  void Match;

  const rawAttendances = await Attendance.find({ player: playerId })
    .populate({
      path: "session",
      select: "dateKey sport status closedAt",
      populate: { path: "sport", select: "name slug" },
    })
    .sort({ createdAt: -1 })
    .lean();

  const attendances = rawAttendances.filter(
    (a) => a.session != null
  ) as unknown as PlayerAttendanceStats["attendances"];

  const closedAttendances = attendances.filter(
    (a) => a.session?.status === "closed"
  );
  const closedTotal = closedAttendances.length;
  const closedPresent = closedAttendances.filter(
    (a) => a.status === "present"
  ).length;
  const closedPercent =
    closedTotal > 0 ? (closedPresent / closedTotal) * 100 : 0;

  const totalSessions = attendances.length;
  const totalPresent = attendances.filter(
    (a) => a.status === "present"
  ).length;
  const totalPercent =
    totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

  // Fetch only this player's match scores and match details
  const rawMatchScores = await MatchScore.find({ player: playerId })
    .populate({
      path: "match",
      select: "dateKey opponent location sport",
      populate: { path: "sport", select: "name slug" },
    })
    .sort({ createdAt: -1 })
    .lean();

  const matchScores = rawMatchScores.filter(
    (m) => m.match != null
  ) as unknown as PlayerMatchScoreItem[];

  const matchCount = matchScores.length;

  return {
    closedTotal,
    closedPresent,
    closedPercent,
    totalSessions,
    totalPresent,
    totalPercent,
    matchCount,
    attendances,
    matchScores,
  };
}
