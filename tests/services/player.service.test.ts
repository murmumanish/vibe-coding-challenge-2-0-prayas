import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlayerAttendanceStats } from "@/services/player.service";
import Attendance from "@/models/Attendance";
import MatchScore from "@/models/MatchScore";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Attendance", () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock("@/models/MatchScore", () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

describe("Player Service Attendance Stats", () => {
  const playerId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates closed and overall attendance percentages and matches correctly", async () => {
    const mockAttendances = [
      {
        _id: "att-1",
        status: "present",
        session: {
          _id: "sess-1",
          dateKey: "2026-11-01",
          status: "closed",
        },
      },
      {
        _id: "att-2",
        status: "absent",
        session: {
          _id: "sess-2",
          dateKey: "2026-11-02",
          status: "closed",
        },
      },
      {
        _id: "att-3",
        status: "present",
        session: {
          _id: "sess-3",
          dateKey: "2026-11-03",
          status: "open",
        },
      },
    ];

    const mockLean = vi.fn().mockResolvedValue(mockAttendances);
    const mockSort = vi.fn().mockReturnValue({ lean: mockLean });
    const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort });
    vi.mocked(Attendance.find).mockReturnValue({ populate: mockPopulate } as any);

    const mockMatches = [
      {
        _id: "score-1",
        primaryScore: 2,
        stats: { notes: "2 goals" },
        match: {
          _id: "match-1",
          dateKey: "2026-11-01",
          opponent: "Rivals FC",
          sport: { name: "Football" },
        },
      },
      {
        _id: "score-2",
        primaryScore: 1,
        match: {
          _id: "match-2",
          dateKey: "2026-11-02",
          opponent: "St. Xavier's",
          sport: { name: "Football" },
        },
      },
    ];

    const matchLean = vi.fn().mockResolvedValue(mockMatches);
    const matchSort = vi.fn().mockReturnValue({ lean: matchLean });
    const matchPopulate = vi.fn().mockReturnValue({ sort: matchSort });
    vi.mocked(MatchScore.find).mockReturnValue({ populate: matchPopulate } as any);

    const stats = await getPlayerAttendanceStats(playerId);

    expect(stats.closedTotal).toBe(2);
    expect(stats.closedPresent).toBe(1);
    expect(stats.closedPercent).toBe(50); // 1 / 2 = 50%

    expect(stats.totalSessions).toBe(3);
    expect(stats.totalPresent).toBe(2);
    expect(stats.totalPercent).toBeCloseTo(66.67, 1); // 2 / 3 = 66.67%
    expect(stats.matchCount).toBe(2);
    expect(stats.matchScores).toHaveLength(2);
    expect(stats.matchScores[0].primaryScore).toBe(2);
  });
});
