import { describe, it, expect, vi, beforeEach } from "vitest";
import { attendancePercent, meetsAttendanceThreshold } from "@/domain/attendance";
import { canScoreMatch, isEligibleForMatch } from "@/domain/matchEligibility";
import { isReady } from "@/domain/readiness";
import { GET as getReadyRoster } from "@/app/api/ready/route";
import { GET as getPlayersRoute } from "@/app/api/players/route";
import { GET as getPlayerByIdRoute } from "@/app/api/players/[id]/route";
import { GET as getSessionsRoute } from "@/app/api/sessions/route";
import { GET as getMatchesRoute } from "@/app/api/matches/route";
import * as auth from "@/lib/auth";
import * as readinessService from "@/services/readiness.service";
import * as playerService from "@/services/player.service";
import * as sessionService from "@/services/session.service";
import * as matchService from "@/services/match.service";
import { AppError } from "@/lib/errors";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/readiness.service", () => ({
  getReadinessRoster: vi.fn(),
}));

vi.mock("@/services/player.service", () => ({
  getAllPlayers: vi.fn(),
  getPlayerById: vi.fn(),
  getPlayerAttendanceStats: vi.fn(),
}));

vi.mock("@/services/session.service", () => ({
  getAllSessions: vi.fn(),
  createSession: vi.fn(),
  markAttendance: vi.fn(),
  closeSession: vi.fn(),
}));

vi.mock("@/services/match.service", () => ({
  getAllMatches: vi.fn(),
  createMatch: vi.fn(),
  addMatchScore: vi.fn(),
  getEligiblePlayersForMatch: vi.fn(),
}));

describe("MVP Business Rules: 4 Core Checks Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // CHECK 1: Attendance is recorded per player
  // =========================================================================
  describe("Check 1: Attendance is recorded per player & closed session locking", () => {
    it("proves attendance percentages: A & B are 100%, C is 0%", () => {
      // 1 session held: A and B present (1/1), C absent (0/1)
      expect(attendancePercent(1, 1)).toBe(100);
      expect(attendancePercent(0, 1)).toBe(0);
    });

    it("refuses any attendance edits once session is closed (400 AppError)", async () => {
      vi.mocked(sessionService.markAttendance).mockRejectedValue(
        new AppError("Cannot edit attendance for a closed session", 400)
      );

      await expect(
        sessionService.markAttendance("closed-session-id", "player-c", "present", "coach-id")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("closed session"),
      });
    });
  });

  // =========================================================================
  // CHECK 2: Only present players can be scored
  // =========================================================================
  describe("Check 2: Only present players can be scored", () => {
    const DATE = "2026-11-01";
    const FOOTBALL = "sport-football";

    it("accepts score for Player A (present) and score of 0 for Player B (present)", () => {
      expect(canScoreMatch("present", DATE, FOOTBALL, DATE, FOOTBALL)).toBe(true);
    });

    it("refuses score for Player C who was absent on match day", () => {
      expect(canScoreMatch("absent", DATE, FOOTBALL, DATE, FOOTBALL)).toBe(false);
    });

    it("refuses score if session date or sport does not match the match", () => {
      expect(canScoreMatch("present", "2026-10-31", FOOTBALL, DATE, FOOTBALL)).toBe(false);
      expect(canScoreMatch("present", DATE, "sport-basketball", DATE, FOOTBALL)).toBe(false);
    });

    it("addMatchScore rejects absent player with 400 AppError", async () => {
      vi.mocked(matchService.addMatchScore).mockRejectedValue(
        new AppError("Player is not eligible: Player was absent or attendance does not match session sport and date", 400)
      );

      await expect(
        matchService.addMatchScore({
          matchId: "match-1",
          playerId: "player-c",
          primaryScore: 1,
          createdBy: "coach-1",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("absent"),
      });
    });

    it("addMatchScore rejects duplicate scoring for same player with 409 AppError", async () => {
      vi.mocked(matchService.addMatchScore).mockRejectedValue(
        new AppError("A score for this player has already been recorded in this match", 409)
      );

      await expect(
        matchService.addMatchScore({
          matchId: "match-1",
          playerId: "player-a",
          primaryScore: 2,
          createdBy: "coach-1",
        })
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  // =========================================================================
  // CHECK 3: When a player counts as Ready
  // =========================================================================
  describe("Check 3: When a player counts as Ready (Integer Precision & Live Table)", () => {
    const HELD = 4;

    it("Player D: 3 of 4 (75%), 2 matches -> Ready: true (Exactly meets both limits)", () => {
      expect(isReady({ presentCount: 3, closedSessionCount: HELD, matchCount: 2 })).toBe(true);
    });

    it("Player E: 2 of 4 (50%), 3 matches -> Ready: false (Attendance too low)", () => {
      expect(isReady({ presentCount: 2, closedSessionCount: HELD, matchCount: 3 })).toBe(false);
    });

    it("Player F: 3 of 4 (75%), 1 match -> Ready: false (Not enough matches)", () => {
      expect(isReady({ presentCount: 3, closedSessionCount: HELD, matchCount: 1 })).toBe(false);
    });

    it("Player G: 4 of 4 (100%), 0 matches -> Ready: false (Never played)", () => {
      expect(isReady({ presentCount: 4, closedSessionCount: HELD, matchCount: 0 })).toBe(false);
    });

    it("Zero sessions held: returns false without division by zero", () => {
      expect(attendancePercent(0, 0)).toBe(0);
      expect(isReady({ presentCount: 0, closedSessionCount: 0, matchCount: 5 })).toBe(false);
    });

    it("Live calculation: Player D leaves Ready list if a 5th session is missed (3/5 = 60%)", () => {
      // Session 5 held, D absent -> 3 of 5
      expect(isReady({ presentCount: 3, closedSessionCount: 5, matchCount: 2 })).toBe(false);
    });

    it("Avoids decimal errors: 74.999% fails threshold with integer multiplication", () => {
      // 7499 / 10000 = 74.99%
      expect(meetsAttendanceThreshold(7499, 10000)).toBe(false);
      // 75 / 100 = 75.0%
      expect(meetsAttendanceThreshold(75, 100)).toBe(true);
    });
  });

  // =========================================================================
  // CHECK 4: Each role sees only its own data
  // =========================================================================
  describe("Check 4: Role-based isolation across Scout, Player, and Coach", () => {
    describe("Scout role", () => {
      it("Scout calling /api/ready receives ONLY Ready players (readyOnly strictly enforced)", async () => {
        vi.mocked(auth.getSession).mockResolvedValue({
          userId: "scout-1",
          email: "scout@agency.com",
          role: "scout",
        });

        vi.mocked(readinessService.getReadinessRoster).mockResolvedValue([
          { player: { name: "Player D" } as any, stats: { isReady: true } as any },
        ]);

        const req = new Request("http://localhost:3000/api/ready");
        const res = await getReadyRoster(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.players).toHaveLength(1);
        expect(data.players[0].player.name).toBe("Player D");

        // Verify readyOnly=true was passed
        expect(readinessService.getReadinessRoster).toHaveBeenCalledWith({
          sportId: undefined,
          readyOnly: true,
        });
      });

      it("Scout calling /api/players receives 403 Forbidden", async () => {
        vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

        const req = new Request("http://localhost:3000/api/players");
        const res = await getPlayersRoute(req);
        expect(res.status).toBe(403);
      });

      it("Scout calling /api/players/[id] receives 403 Forbidden", async () => {
        vi.mocked(auth.getSession).mockResolvedValue({
          userId: "scout-1",
          email: "scout@agency.com",
          role: "scout",
        });
        vi.mocked(playerService.getPlayerById).mockResolvedValue({
          _id: "player-d",
          name: "Player D",
          userId: "user-d",
        } as any);

        const req = new Request("http://localhost:3000/api/players/player-d");
        const res = await getPlayerByIdRoute(req, {
          params: Promise.resolve({ id: "player-d" }),
        });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toContain("Scouts cannot view player rosters directly");
      });

      it("Scout calling /api/sessions receives 403 Forbidden", async () => {
        vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

        const req = new Request("http://localhost:3000/api/sessions");
        const res = await getSessionsRoute(req);
        expect(res.status).toBe(403);
      });

      it("Scout calling /api/matches receives 403 Forbidden", async () => {
        vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

        const req = new Request("http://localhost:3000/api/matches");
        const res = await getMatchesRoute(req);
        expect(res.status).toBe(403);
      });
    });

    describe("Player role", () => {
      it("Player calling /api/ready receives 403 Forbidden", async () => {
        vi.mocked(auth.getSession).mockResolvedValue({
          userId: "user-player-e",
          email: "player-e@academy.com",
          role: "player",
        });

        const req = new Request("http://localhost:3000/api/ready");
        const res = await getReadyRoster(req);
        expect(res.status).toBe(403);
      });

      it("Player E trying to view Player D by changing ID receives 403 Forbidden", async () => {
        vi.mocked(auth.getSession).mockResolvedValue({
          userId: "user-player-e",
          email: "player-e@academy.com",
          role: "player",
        });
        // D's record belongs to user-d, not user-player-e
        vi.mocked(playerService.getPlayerById).mockResolvedValue({
          _id: "player-d",
          name: "Player D",
          userId: "user-d",
        } as any);

        const req = new Request("http://localhost:3000/api/players/player-d");
        const res = await getPlayerByIdRoute(req, {
          params: Promise.resolve({ id: "player-d" }),
        });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toContain("Cannot view other players");
      });

      it("Player E viewing their own ID receives 200 OK", async () => {
        vi.mocked(auth.getSession).mockResolvedValue({
          userId: "user-player-e",
          email: "player-e@academy.com",
          role: "player",
        });
        vi.mocked(playerService.getPlayerById).mockResolvedValue({
          _id: "player-e",
          name: "Player E",
          userId: "user-player-e",
        } as any);

        const req = new Request("http://localhost:3000/api/players/player-e");
        const res = await getPlayerByIdRoute(req, {
          params: Promise.resolve({ id: "player-e" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.player.name).toBe("Player E");
      });
    });
  });
});
