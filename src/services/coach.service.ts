// src/services/coach.service.ts
import { dbConnect } from "@/lib/db";
import User, { IUser } from "@/models/User";
import Sport, { ISport } from "@/models/Sport";
import { hashPassword } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { Types } from "mongoose";

export interface CoachWithSports {
  _id: string;
  name: string;
  email: string;
  role: "coach";
  isActive: boolean;
  assignedSports: Array<{
    _id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export async function getAllCoaches() {
  await dbConnect();
  return User.find({ role: "coach" })
    .select("-password")
    .populate("assignedSports", "name slug isActive scoreFields")
    .sort({ name: 1 })
    .lean();
}

export async function getCoachById(id: string) {
  await dbConnect();
  const coach = await User.findOne({ _id: id, role: "coach" })
    .select("-password")
    .populate("assignedSports", "name slug isActive scoreFields")
    .lean();

  if (!coach) {
    throw new AppError("Coach not found", 404);
  }
  return coach;
}

export async function assignSportsToCoach(coachId: string, sportIds: string[]) {
  await dbConnect();

  // Validate coach exists
  const existingCoach = await User.findOne({ _id: coachId, role: "coach" });
  if (!existingCoach) {
    throw new AppError("Coach not found", 404);
  }

  // Filter valid ObjectId strings
  const validObjectIds = (sportIds || [])
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  // Verify sports exist
  const sports = await Sport.find({ _id: { $in: validObjectIds } });
  const verifiedSportIds = sports.map((s) => s._id);

  existingCoach.assignedSports = verifiedSportIds as any;
  await existingCoach.save();

  const updated = await User.findById(coachId)
    .select("-password")
    .populate("assignedSports", "name slug isActive scoreFields")
    .lean();
  if (!updated) {
    throw new AppError("Coach not found", 404);
  }
  return updated;
}

export async function getCoachAssignedSports(coachUserId: string): Promise<ISport[]> {
  await dbConnect();
  const coach = await User.findOne({ _id: coachUserId, role: "coach" })
    .populate("assignedSports")
    .lean();

  if (!coach || !coach.assignedSports) {
    return [];
  }

  // Filter out any deactivated or null sports
  const sports = (coach.assignedSports as unknown as ISport[]) || [];
  return sports.filter((s) => s && s.isActive !== false);
}

export async function createCoach(data: {
  name: string;
  email: string;
  password?: string;
  sportIds?: string[];
}): Promise<IUser> {
  await dbConnect();

  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const rawPassword = data.password && data.password.trim() ? data.password.trim() : "coach123";
  if (rawPassword.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const hashedPassword = await hashPassword(rawPassword);

  let verifiedSportIds: Types.ObjectId[] = [];
  if (data.sportIds && data.sportIds.length > 0) {
    const validObjectIds = data.sportIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const sports = await Sport.find({ _id: { $in: validObjectIds } });
    verifiedSportIds = sports.map((s) => s._id) as any;
  }

  return User.create({
    name: data.name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "coach",
    assignedSports: verifiedSportIds,
    isActive: true,
  });
}
