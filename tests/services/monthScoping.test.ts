import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllSessions, getSessionMonths } from "@/services/session.service";
import { getAllMatches, getMatchMonths } from "@/services/match.service";
import Session from "@/models/Session";
import Match from "@/models/Match";
import User from "@/models/User";
import Sport from "@/models/Sport";
import Player from "@/models/Player";
import Attendance from "@/models/Attendance";
import MatchScore from "@/models/MatchScore";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Session", () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock("@/models/Match", () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock("@/models/Sport", () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock("@/models/User", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("@/models/Player", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/models/Attendance", () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock("@/models/MatchScore", () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

describe("Service-level Month and Role Scoping", () => {
  const sportId1 = new Types.ObjectId();
  const sportId2 = new Types.ObjectId();
  const coachUserId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllSessions with month filtering", () => {
    it("constructs dateKey range query for the requested month", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Session.find).mockReturnValue(mockQuery as any);

      await getAllSessions({ month: "2026-10" });

      expect(Session.find).toHaveBeenCalledWith(
        expect.objectContaining({
          dateKey: {
            $gte: "2026-10-01",
            $lte: "2026-10-31",
          },
        })
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ dateKey: -1, _id: -1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(200);
    });

    it("scopes coach queries to assigned sports", async () => {
      vi.mocked(User.findById).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            assignedSports: [sportId1],
          }),
        }),
      } as any);

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Session.find).mockReturnValue(mockQuery as any);

      await getAllSessions(
        { month: "2026-10" },
        { userId: coachUserId, role: "coach" }
      );

      expect(Session.find).toHaveBeenCalledWith(
        expect.objectContaining({
          sport: { $in: [sportId1] },
          dateKey: { $gte: "2026-10-01", $lte: "2026-10-31" },
        })
      );
    });

    it("returns empty array if coach requests a sport they are not assigned to", async () => {
      vi.mocked(User.findById).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            assignedSports: [sportId1], // only sportId1 assigned
          }),
        }),
      } as any);

      vi.mocked(Sport.findOne).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: sportId2 }), // requested sportId2
        }),
      } as any);

      const result = await getAllSessions(
        { month: "2026-10", sport: sportId2.toString() },
        { userId: coachUserId, role: "coach" }
      );

      expect(result).toEqual([]);
      expect(Session.find).not.toHaveBeenCalled();
    });
  });

  describe("getSessionMonths aggregation", () => {
    it("aggregates substr(dateKey, 0, 7) and returns months array with earliestMonth", async () => {
      vi.mocked(Session.aggregate).mockResolvedValue([
        { _id: "2026-10", count: 12 },
        { _id: "2026-09", count: 5 },
      ]);

      const result = await getSessionMonths({});

      expect(result.months).toEqual([
        { month: "2026-10", count: 12 },
        { month: "2026-09", count: 5 },
      ]);
      expect(result.earliestMonth).toBe("2026-09");
      expect(Session.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $project: { month: { $substrCP: ["$dateKey", 0, 7] } },
          }),
          expect.objectContaining({
            $group: { _id: "$month", count: { $sum: 1 } },
          }),
        ])
      );
    });
  });

  describe("getAllMatches with player scoping", () => {
    it("scopes player queries to matches where the player has a score", async () => {
      const playerId = new Types.ObjectId();
      const matchId1 = new Types.ObjectId();

      vi.mocked(Player.findOne).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: playerId }),
        }),
      } as any);

      vi.mocked(MatchScore.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ match: matchId1 }]),
        }),
      } as any);

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Match.find).mockReturnValue(mockQuery as any);

      await getAllMatches(
        { month: "2026-10" },
        { userId: "player-user-id", role: "player" }
      );

      expect(Match.find).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: { $in: [matchId1] },
          dateKey: { $gte: "2026-10-01", $lte: "2026-10-31" },
        })
      );
    });
  });

  describe("getMatchMonths aggregation", () => {
    it("aggregates substr(dateKey, 0, 7) for matches and returns counts", async () => {
      vi.mocked(Match.aggregate).mockResolvedValue([
        { _id: "2026-10", count: 4 },
      ]);

      const result = await getMatchMonths({});

      expect(result.months).toEqual([{ month: "2026-10", count: 4 }]);
      expect(result.earliestMonth).toBe("2026-10");
    });
  });
});
