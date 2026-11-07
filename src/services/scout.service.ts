// src/services/scout.service.ts
import { dbConnect } from "@/lib/db";
import User, { IUser } from "@/models/User";
import Sport, { ISport } from "@/models/Sport";
import { hashPassword } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { Types } from "mongoose";

export interface ScoutWithSports {
  _id: string;
  name: string;
  email: string;
  role: "scout";
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

export async function getAllScouts() {
  await dbConnect();
  return User.find({ role: "scout" })
    .select("-password")
    .populate("assignedSports", "name slug isActive scoreFields")
    .sort({ name: 1 })
    .lean();
}

export async function getScoutById(id: string) {
  await dbConnect();
  const scout = await User.findOne({ _id: id, role: "scout" })
    .select("-password")
    .populate("assignedSports", "name slug isActive scoreFields")
    .lean();

  if (!scout) {
    throw new AppError("Scout not found", 404);
  }
  return scout;
}

export async function assignSportsToScout(scoutId: string, sportIds: string[]) {
  await dbConnect();

  // Validate scout exists
  const existingScout = await User.findOne({ _id: scoutId, role: "scout" });
  if (!existingScout) {
    throw new AppError("Scout not found", 404);
  }

  // Filter valid ObjectId strings
  const validObjectIds = (sportIds || [])
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  // Verify sports exist
  const sports = await Sport.find({ _id: { $in: validObjectIds } });
  const verifiedSportIds = sports.map((s) => s._id);

  existingScout.assignedSports = verifiedSportIds as any;
  await existingScout.save();

  const updated = await User.findById(scoutId)
    .select("-password")
    .populate("assignedSports", "name slug isActive scoreFields")
    .lean();
  if (!updated) {
    throw new AppError("Scout not found", 404);
  }
  return updated;
}

export async function getScoutAssignedSports(scoutUserId: string): Promise<ISport[]> {
  await dbConnect();
  const scout = await User.findOne({ _id: scoutUserId, role: "scout" })
    .populate("assignedSports")
    .lean();

  if (!scout || !scout.assignedSports) {
    return [];
  }

  const sports = (scout.assignedSports as unknown as ISport[]) || [];
  return sports.filter((s) => s && s.isActive !== false);
}

export async function createScout(data: {
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

  const rawPassword =
    data.password && data.password.trim() ? data.password.trim() : "scout123";
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
    role: "scout",
    assignedSports: verifiedSportIds,
    isActive: true,
  });
}
