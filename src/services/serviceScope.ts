// src/services/serviceScope.ts
import Sport from "@/models/Sport";
import User from "@/models/User";
import { Types } from "mongoose";

/**
 * Resolves a sport parameter (which may be an ObjectId string or a slug)
 * into a Mongoose Types.ObjectId.
 */
export async function resolveSportId(param?: string): Promise<Types.ObjectId | undefined> {
  if (!param) return undefined;
  if (Types.ObjectId.isValid(param)) {
    return new Types.ObjectId(param);
  }
  const sport = await Sport.findOne({ slug: param }).select("_id").lean();
  if (sport) {
    return sport._id as Types.ObjectId;
  }
  return undefined;
}

/**
 * Determines the sport filter to apply based on the user's role and requested sport.
 * - Coach: always intersected with the coach's assigned sports.
 * - Admin / internal: directly filters by requested sport (if any).
 * - Player: filters by requested sport (if any); score/attendance scoping is handled separately.
 */
export async function getScopedSportFilter(
  user?: { userId: string; role: string },
  sportParam?: string
): Promise<{ sportFilter?: unknown; emptyResult: boolean }> {
  const targetSportId = await resolveSportId(sportParam);

  if (!user) {
    return { sportFilter: targetSportId, emptyResult: false };
  }

  if (user.role === "admin") {
    return { sportFilter: targetSportId, emptyResult: false };
  }

  if (user.role === "coach") {
    void User;
    const coachUser = await User.findById(user.userId).select("assignedSports").lean();
    const assigned = (((coachUser as any)?.assignedSports || []) as unknown as Types.ObjectId[]);
    const assignedStrSet = new Set(assigned.map((id) => id.toString()));

    if (targetSportId) {
      if (assignedStrSet.has(targetSportId.toString())) {
        return { sportFilter: targetSportId, emptyResult: false };
      }
      return { emptyResult: true };
    }

    if (assigned.length === 0) {
      return { emptyResult: true };
    }
    return { sportFilter: { $in: assigned }, emptyResult: false };
  }

  if (user.role === "player") {
    return { sportFilter: targetSportId, emptyResult: false };
  }

  return { emptyResult: false };
}
