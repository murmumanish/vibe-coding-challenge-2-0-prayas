import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMatch,
  addMatchScore,
} from "@/services/match.service";
import Match from "@/models/Match";
import MatchScore from "@/models/MatchScore";
import Session from "@/models/Session";
import Attendance from "@/models/Attendance";
import Sport from "@/models/Sport";
import Player from "@/models/Player";
import { AppError } from "@/lib/errors";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Match", () => ({
  default: {
    findById: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("@/models/MatchScore", () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock("@/models/Session", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/models/Attendance", () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("@/models/Sport", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("@/models/Player", () => ({
  default: {
    findById: vi.fn(),
  },
}));

describe("Match Service", () => {
  const sportId = new Types.ObjectId().toString();
  const coachUserId = new Types.ObjectId().toString();
  const playerId = new Types.ObjectId().toString();
  const matchId = new Types.ObjectId().toString();
  const sessionId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMatch", () => {
    it("throws 404 if sport does not exist", async () => {
      vi.mocked(Sport.findById).mockResolvedValue(null);

      await expect(
        createMatch({
          dateKey: "2026-11-02",
          sportId,
          opponent: "Rivals FC",
          createdBy: coachUserId,
        })
      ).rejects.toThrow("Sport not found");
    });

    it("throws 400 if sport is inactive", async () => {
      vi.mocked(Sport.findById).mockResolvedValue({
        _id: sportId,
        isActive: false,
      } as any);

      await expect(
        createMatch({
          dateKey: "2026-11-02",
          sportId,
          opponent: "Rivals FC",
          createdBy: coachUserId,
        })
      ).rejects.toThrow("Cannot create a match for an inactive sport");
    });

    it("creates a match successfully", async () => {
      vi.mocked(Sport.findById).mockResolvedValue({
        _id: sportId,
        isActive: true,
      } as any);

      const createdMatchObj = {
        _id: matchId,
        dateKey: "2026-11-02",
        sport: sportId,
        opponent: "Rivals FC",
        location: "Main Turf",
        createdBy: coachUserId,
      };
      vi.mocked(Match.create).mockResolvedValue(createdMatchObj as any);

      const result = await createMatch({
        dateKey: "2026-11-02",
        sportId,
        opponent: "Rivals FC",
        location: "Main Turf",
        createdBy: coachUserId,
      });

      expect(result).toEqual(createdMatchObj);
    });
  });

  describe("addMatchScore (Eligibility Enforcement)", () => {
    const mockMatch = {
      _id: matchId,
      dateKey: "2026-11-02",
      sport: sportId,
      opponent: "Rivals FC",
    };

    const mockPlayer = {
      _id: playerId,
      name: "Marcus Rashford",
    };

    it("rejects when player already has a score in this match (409)", async () => {
      vi.mocked(Match.findById).mockResolvedValue(mockMatch as any);
      vi.mocked(Player.findById).mockResolvedValue(mockPlayer as any);
      vi.mocked(MatchScore.findOne).mockResolvedValue({ _id: "existing-score" } as any);

      await expect(
        addMatchScore({
          matchId,
          playerId,
          primaryScore: 2,
          createdBy: coachUserId,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("rejects when no practice session exists on match date/sport (400)", async () => {
      vi.mocked(Match.findById).mockResolvedValue(mockMatch as any);
      vi.mocked(Player.findById).mockResolvedValue(mockPlayer as any);
      vi.mocked(MatchScore.findOne).mockResolvedValue(null);
      vi.mocked(Session.findOne).mockResolvedValue(null);

      await expect(
        addMatchScore({
          matchId,
          playerId,
          primaryScore: 2,
          createdBy: coachUserId,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("No practice session was held"),
      });
    });

    it("rejects absent players with 400", async () => {
      vi.mocked(Match.findById).mockResolvedValue(mockMatch as any);
      vi.mocked(Player.findById).mockResolvedValue(mockPlayer as any);
      vi.mocked(MatchScore.findOne).mockResolvedValue(null);

      // Session exists for that date and sport
      vi.mocked(Session.findOne).mockResolvedValue({
        _id: sessionId,
        dateKey: "2026-11-02",
        sport: sportId,
      } as any);

      // But player was ABSENT
      vi.mocked(Attendance.findOne).mockResolvedValue({
        session: sessionId,
        player: playerId,
        status: "absent",
      } as any);

      try {
        await addMatchScore({
          matchId,
          playerId,
          primaryScore: 2,
          createdBy: coachUserId,
        });
        expect.unreachable("Should have thrown 400");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain("Player was absent");
      }
    });

    it("rejects different sports or dates with 400", async () => {
      vi.mocked(Match.findById).mockResolvedValue(mockMatch as any);
      vi.mocked(Player.findById).mockResolvedValue(mockPlayer as any);
      vi.mocked(MatchScore.findOne).mockResolvedValue(null);

      // Session exists with different date
      vi.mocked(Session.findOne).mockResolvedValue({
        _id: sessionId,
        dateKey: "2026-11-01", // different date
        sport: sportId,
      } as any);

      vi.mocked(Attendance.findOne).mockResolvedValue({
        session: sessionId,
        player: playerId,
        status: "present",
      } as any);

      try {
        await addMatchScore({
          matchId,
          playerId,
          primaryScore: 2,
          createdBy: coachUserId,
        });
        expect.unreachable("Should have thrown 400");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
      }
    });

    it("records score when player was present in practice session on match date and sport", async () => {
      vi.mocked(Match.findById).mockResolvedValue(mockMatch as any);
      vi.mocked(Player.findById).mockResolvedValue(mockPlayer as any);
      vi.mocked(MatchScore.findOne).mockResolvedValue(null);

      vi.mocked(Session.findOne).mockResolvedValue({
        _id: sessionId,
        dateKey: "2026-11-02",
        sport: sportId,
      } as any);

      vi.mocked(Attendance.findOne).mockResolvedValue({
        session: sessionId,
        player: playerId,
        status: "present",
      } as any);

      const mockCreatedScore = {
        _id: "score-123",
        match: matchId,
        player: playerId,
        primaryScore: 3,
        createdBy: coachUserId,
      };
      vi.mocked(MatchScore.create).mockResolvedValue(mockCreatedScore as any);

      const result = await addMatchScore({
        matchId,
        playerId,
        primaryScore: 3,
        createdBy: coachUserId,
      });

      expect(result).toEqual(mockCreatedScore);
      expect(MatchScore.create).toHaveBeenCalledWith({
        match: matchId,
        player: playerId,
        primaryScore: 3,
        stats: undefined,
        createdBy: expect.any(Types.ObjectId),
      });
    });
  });
});
