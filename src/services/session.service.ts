// src/services/session.service.ts
import { dbConnect } from "@/lib/db";
import Session, { ISession } from "@/models/Session";
import Sport from "@/models/Sport";
import Player from "@/models/Player";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import { AppError } from "@/lib/errors";
import { Types } from "mongoose";

export interface CreateSessionInput {
  dateKey: string;
  sportId: string;
  createdBy: string;
}

export interface SessionFilterOptions {
  sportId?: string;
  status?: "open" | "closed";
  dateKey?: string;
}

/**
 * Creates a new practice session and automatically generates Attendance rows
 * (status: "absent") for all active players assigned to that sport.
 */
export async function createSession(data: CreateSessionInput): Promise<ISession> {
  await dbConnect();

  // 1. Validate sport exists and isActive
  const sport = await Sport.findById(data.sportId);
  if (!sport) {
    throw new AppError("Sport not found", 404);
  }
  if (!sport.isActive) {
    throw new AppError("Cannot create a session for an inactive sport", 400);
  }

  // 2. Enforce one session per sport per dayKey
  const existing = await Session.findOne({
    sport: sport._id,
    dateKey: data.dateKey,
  });
  if (existing) {
    throw new AppError("A session already exists for this sport on this date", 409);
  }

  // 3. Create the session
  const session = await Session.create({
    dateKey: data.dateKey,
    sport: sport._id,
    createdBy: new Types.ObjectId(data.createdBy),
    status: "open",
  });

  // 4. Auto-create Attendance rows (status: "absent") for all active players of that sport
  const activePlayers = await Player.find({
    sport: sport._id,
    isActive: true,
  }).select("_id");

  if (activePlayers.length > 0) {
    const attendanceDocs = activePlayers.map((player) => ({
      session: session._id,
      player: player._id,
      status: "absent" as const,
    }));

    await Attendance.insertMany(attendanceDocs, { ordered: false });
  }

  return session;
}

/**
 * Fetches all sessions with optional filtering and aggregates attendance stats.
 */
export async function getAllSessions(options?: SessionFilterOptions) {
  await dbConnect();
  const filter: Record<string, unknown> = {};

  if (options?.sportId) {
    filter.sport = options.sportId;
  }
  if (options?.status) {
    filter.status = options.status;
  }
  if (options?.dateKey) {
    filter.dateKey = options.dateKey;
  }

  void User;
  const sessions = await Session.find(filter)
    .populate("sport", "name slug isActive")
    .populate("createdBy", "name email")
    .sort({ dateKey: -1, createdAt: -1 })
    .lean();

  if (sessions.length === 0) {
    return [];
  }

  // Calculate attendance summaries for each session
  const sessionIds = sessions.map((s) => s._id);
  const attendanceAggregates = await Attendance.aggregate<{
    _id: Types.ObjectId;
    total: number;
    present: number;
  }>([
    { $match: { session: { $in: sessionIds } } },
    {
      $group: {
        _id: "$session",
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
      },
    },
  ]);

  const statsMap = new Map<string, { total: number; present: number }>();
  for (const item of attendanceAggregates) {
    statsMap.set(item._id.toString(), {
      total: item.total,
      present: item.present,
    });
  }

  return sessions.map((s) => {
    const stats = statsMap.get(s._id.toString()) || { total: 0, present: 0 };
    return {
      ...s,
      attendanceStats: stats,
    };
  });
}

/**
 * Gets a single session by ID.
 */
export async function getSessionById(id: string) {
  await dbConnect();
  const session = await Session.findById(id)
    .populate("sport", "name slug isActive")
    .populate("createdBy", "name email")
    .lean();

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  return session;
}

/**
 * Gets a session along with its full list of attendance rows and populated player details.
 */
export async function getSessionWithAttendance(id: string) {
  await dbConnect();
  const session = await getSessionById(id);

  const attendances = await Attendance.find({ session: id })
    .populate("player", "name age isActive")
    .populate("markedBy", "name email")
    .lean();

  // Sort attendances alphabetically by player name
  attendances.sort((a, b) => {
    const nameA = (a.player as { name?: string })?.name || "";
    const nameB = (b.player as { name?: string })?.name || "";
    return nameA.localeCompare(nameB);
  });

  return { session, attendances };
}

/**
 * Marks attendance for a player in a session.
 * Throws 400 if the session is closed!
 */
export async function markAttendance(
  sessionId: string,
  playerId: string,
  status: "present" | "absent",
  markedByUserId: string
) {
  await dbConnect();

  // 1. Check session existence and closed status
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError("Session not found", 404);
  }
  if (session.status === "closed" || session.closedAt) {
    throw new AppError("Cannot edit attendance for a closed session", 400);
  }

  // 2. Validate player
  const player = await Player.findById(playerId);
  if (!player) {
    throw new AppError("Player not found", 404);
  }

  // 3. Update or upsert attendance record
  const attendance = await Attendance.findOneAndUpdate(
    { session: session._id, player: player._id },
    {
      status,
      markedBy: new Types.ObjectId(markedByUserId),
    },
    { new: true, upsert: true }
  ).populate("player", "name age isActive");

  return attendance;
}

/**
 * Batch marks attendance for multiple players in a session.
 * Throws 400 if session is closed.
 */
export async function markBatchAttendance(
  sessionId: string,
  updates: Array<{ playerId: string; status: "present" | "absent" }>,
  markedByUserId: string
) {
  await dbConnect();

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError("Session not found", 404);
  }
  if (session.status === "closed" || session.closedAt) {
    throw new AppError("Cannot edit attendance for a closed session", 400);
  }

  const markedBy = new Types.ObjectId(markedByUserId);

  const bulkOps = updates.map((u) => ({
    updateOne: {
      filter: { session: session._id, player: new Types.ObjectId(u.playerId) },
      update: { $set: { status: u.status, markedBy } },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await Attendance.bulkWrite(bulkOps);
  }

  return getSessionWithAttendance(sessionId);
}

/**
 * Closes a session, sets closedAt timestamp, and prevents any further attendance edits.
 */
export async function closeSession(id: string): Promise<ISession> {
  await dbConnect();

  const session = await Session.findById(id);
  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (session.status === "closed") {
    return session;
  }

  session.status = "closed";
  session.closedAt = new Date();
  await session.save();

  return session;
}
