import { describe, it, expect, vi, beforeEach } from "vitest";
import { getReadinessRoster } from "@/services/readiness.service";
import Player from "@/models/Player";
import Attendance from "@/models/Attendance";
import MatchScore from "@/models/MatchScore";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Player", () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock("@/models/Attendance", () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock("@/models/MatchScore", () => ({
  default: {
    countDocuments: vi.fn(),
  },
}));

describe("Readiness Service", () => {
  const p1Id = new Types.ObjectId().toString(); // Will have 75% attendance, 2 matches -> Ready
  const p2Id = new Types.ObjectId().toString(); // Will have 74% attendance, 2 matches -> Not Ready
  const p3Id = new Types.ObjectId().toString(); // Will have 75% attendance, 1 match -> Not Ready

  const mockPlayers = [
    { _id: p1Id, name: "Player Ready", isActive: true, sport: { name: "Football" } },
    { _id: p2Id, name: "Player 74 Percent", isActive: true, sport: { name: "Football" } },
    { _id: p3Id, name: "Player 1 Match", isActive: true, sport: { name: "Football" } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const mockSort = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockPlayers) });
    const mockPopulate2 = vi.fn().mockReturnValue({ sort: mockSort });
    const mockPopulate1 = vi.fn().mockReturnValue({ populate: mockPopulate2 });
    vi.mocked(Player.find).mockReturnValue({ populate: mockPopulate1 } as any);
  });

  it("calculates readiness correctly for all players (Coach view)", async () => {
    // Player 1: 3/4 = 75% in closed sessions, 2 matches -> READY
    const p1Attendances = [
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "absent", session: { status: "closed" } },
    ];

    // Player 2: 74 out of 100 = 74.0%, 2 matches -> NOT READY
    const p2Attendances = Array.from({ length: 100 }, (_, i) => ({
      status: i < 74 ? "present" : "absent",
      session: { status: "closed" },
    }));

    // Player 3: 3/4 = 75% in closed sessions, 1 match -> NOT READY
    const p3Attendances = [
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "absent", session: { status: "closed" } },
    ];

    vi.mocked(Attendance.find).mockImplementation((query: any) => {
      const pId = query.player.toString();
      let atts = p1Attendances;
      if (pId === p2Id) atts = p2Attendances;
      if (pId === p3Id) atts = p3Attendances;

      return {
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(atts),
        }),
      } as any;
    });

    (MatchScore.countDocuments as any).mockImplementation(async (query: any) => {
      const pId = query.player.toString();
      if (pId === p1Id) return 2;
      if (pId === p2Id) return 2;
      if (pId === p3Id) return 1;
      return 0;
    });

    const roster = await getReadinessRoster({ readyOnly: false });
    expect(roster).toHaveLength(3);

    // Player 1: 75% and 2 matches -> Ready
    const r1 = roster.find((r) => r.player._id.toString() === p1Id);
    expect(r1?.stats.attendancePercent).toBe(75);
    expect(r1?.stats.matchCount).toBe(2);
    expect(r1?.stats.isReady).toBe(true);

    // Player 2: 74% and 2 matches -> Not Ready
    const r2 = roster.find((r) => r.player._id.toString() === p2Id);
    expect(r2?.stats.attendancePercent).toBe(74);
    expect(r2?.stats.matchCount).toBe(2);
    expect(r2?.stats.isReady).toBe(false);

    // Player 3: 75% and 1 match -> Not Ready
    const r3 = roster.find((r) => r.player._id.toString() === p3Id);
    expect(r3?.stats.attendancePercent).toBe(75);
    expect(r3?.stats.matchCount).toBe(1);
    expect(r3?.stats.isReady).toBe(false);
  });

  it("filters strictly to ONLY Ready players when readyOnly is true (Scout view)", async () => {
    // Player 1: 3/4 = 75%, 2 matches -> Ready
    const p1Attendances = [
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "absent", session: { status: "closed" } },
    ];
    // Player 2: 74%
    const p2Attendances = Array.from({ length: 100 }, (_, i) => ({
      status: i < 74 ? "present" : "absent",
      session: { status: "closed" },
    }));
    // Player 3: 75%, 1 match
    const p3Attendances = [
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "present", session: { status: "closed" } },
      { status: "absent", session: { status: "closed" } },
    ];

    vi.mocked(Attendance.find).mockImplementation((query: any) => {
      const pId = query.player.toString();
      let atts = p1Attendances;
      if (pId === p2Id) atts = p2Attendances;
      if (pId === p3Id) atts = p3Attendances;

      return {
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(atts),
        }),
      } as any;
    });

    (MatchScore.countDocuments as any).mockImplementation(async (query: any) => {
      const pId = query.player.toString();
      if (pId === p1Id) return 2;
      if (pId === p2Id) return 2;
      if (pId === p3Id) return 1;
      return 0;
    });

    const readyRoster = await getReadinessRoster({ readyOnly: true });

    // ONLY Player 1 should be present!
    expect(readyRoster).toHaveLength(1);
    expect(readyRoster[0].player._id.toString()).toBe(p1Id);
    expect(readyRoster[0].stats.isReady).toBe(true);
  });
});
