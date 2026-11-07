import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatEqualScoreParams } from "@/lib/scoreParams";
import { getAllSessions } from "@/services/session.service";
import { getAllMatches } from "@/services/match.service";
import Session from "@/models/Session";
import Match from "@/models/Match";
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

describe("Player History and Score Formatting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatEqualScoreParams", () => {
    it("represents all score parameters equally for Cricket", () => {
      const score = {
        primaryScore: 40,
        stats: {
          wickets: 1,
          catches: 3,
        },
        match: {
          sport: {
            name: "Cricket",
            slug: "cricket",
            scoreFields: [
              { key: "runs", label: "Runs", isPrimary: true, isActive: true },
              { key: "wickets", label: "Wickets", isPrimary: false, isActive: true },
              { key: "catches", label: "Catches", isPrimary: false, isActive: true },
            ],
          },
        },
      };

      const params = formatEqualScoreParams(score, "Cricket");
      expect(params).toHaveLength(3);
      expect(params[0]).toEqual({
        key: "runs",
        label: "Runs",
        value: 40,
        unit: undefined,
      });
      expect(params[1]).toEqual({
        key: "wickets",
        label: "Wickets",
        value: 1,
        unit: undefined,
      });
      expect(params[2]).toEqual({
        key: "catches",
        label: "Catches",
        value: 3,
        unit: undefined,
      });
    });

    it("does not output redundant 'Score' parameter if stats contains 'score'", () => {
      const score = {
        primaryScore: 45,
        stats: {
          score: 45,
        },
        match: {
          sport: {
            name: "Cricket",
            slug: "cricket",
            scoreFields: [
              { key: "runs", label: "Runs", isPrimary: true, isActive: true },
              { key: "wickets", label: "Wickets", isPrimary: false, isActive: true },
              { key: "catches", label: "Catches", isPrimary: false, isActive: true },
            ],
          },
        },
      };

      const params = formatEqualScoreParams(score, "Cricket");
      expect(params).toHaveLength(3);
      expect(params.map((p) => p.label)).toEqual(["Runs", "Wickets", "Catches"]);
      expect(params.some((p) => p.label.toLowerCase() === "score")).toBe(false);
    });

    it("handles Football score fields with equal representation", () => {
      const score = {
        primaryScore: 2,
        stats: {
          assists: 1,
        },
        match: {
          sport: {
            name: "Football",
            slug: "football",
            scoreFields: [
              { key: "goals", label: "Goals", isPrimary: true, isActive: true },
              { key: "assists", label: "Assists", isPrimary: false, isActive: true },
            ],
          },
        },
      };

      const params = formatEqualScoreParams(score, "Football");
      expect(params).toHaveLength(2);
      expect(params[0].label).toBe("Goals");
      expect(params[0].value).toBe(2);
      expect(params[1].label).toBe("Assists");
      expect(params[1].value).toBe(1);
    });

    it("falls back gracefully when score object is null or undefined", () => {
      expect(formatEqualScoreParams(null, "Cricket")).toEqual([]);
      expect(formatEqualScoreParams(undefined, "Cricket")).toEqual([]);
    });
  });

  describe("getAllSessions with player myStatus", () => {
    it("attaches myStatus (present/absent) to sessions for player", async () => {
      const playerId = new Types.ObjectId();
      const sessionId1 = new Types.ObjectId();
      const sessionId2 = new Types.ObjectId();

      vi.mocked(Player.findOne).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: playerId }),
        }),
      } as any);

      vi.mocked(Attendance.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { session: sessionId1, status: "present" },
            { session: sessionId2, status: "absent" },
          ]),
        }),
      } as any);

      const mockSessions = [
        {
          _id: sessionId1,
          dateKey: "2026-11-10",
          status: "closed",
        },
        {
          _id: sessionId2,
          dateKey: "2026-11-09",
          status: "open",
        },
      ];

      vi.mocked(Session.find).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSessions),
      } as any);

      vi.mocked(Attendance.aggregate).mockResolvedValue([
        { _id: sessionId1, total: 10, present: 8 },
        { _id: sessionId2, total: 10, present: 7 },
      ]);

      const result = await getAllSessions(
        { month: "2026-11" },
        { userId: "player-uid", role: "player" }
      );

      expect(result).toHaveLength(2);
      expect((result[0] as any).myStatus).toBe("present");
      expect((result[1] as any).myStatus).toBe("absent");
    });
  });

  describe("getAllMatches with player myScore", () => {
    it("attaches player's performance score to matches for player", async () => {
      const playerId = new Types.ObjectId();
      const matchId1 = new Types.ObjectId();

      vi.mocked(Player.findOne).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: playerId }),
        }),
      } as any);

      vi.mocked(MatchScore.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              match: matchId1,
              primaryScore: 40,
              stats: { wickets: 1, catches: 3 },
            },
          ]),
        }),
      } as any);

      const mockMatches = [
        {
          _id: matchId1,
          dateKey: "2026-11-08",
          opponent: "Ranchi Academy",
          sport: {
            name: "Cricket",
            slug: "cricket",
            scoreFields: [
              { key: "runs", label: "Runs", isPrimary: true, isActive: true },
              { key: "wickets", label: "Wickets", isPrimary: false, isActive: true },
              { key: "catches", label: "Catches", isPrimary: false, isActive: true },
            ],
          },
        },
      ];

      vi.mocked(Match.find).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockMatches),
      } as any);

      vi.mocked(MatchScore.aggregate).mockResolvedValue([
        { _id: matchId1, count: 11 },
      ]);

      const result = await getAllMatches(
        { month: "2026-11" },
        { userId: "player-uid", role: "player" }
      );

      expect(result).toHaveLength(1);
      expect((result[0] as any).myScore).toEqual({
        primaryScore: 40,
        stats: { wickets: 1, catches: 3 },
      });
    });
  });
});
