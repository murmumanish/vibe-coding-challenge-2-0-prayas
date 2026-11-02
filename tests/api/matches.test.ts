import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getMatches, POST as createMatchRoute } from "@/app/api/matches/route";
import { POST as addScoreRoute } from "@/app/api/matches/[id]/scores/route";
import * as auth from "@/lib/auth";
import * as matchService from "@/services/match.service";
import { AppError } from "@/lib/errors";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/match.service", () => ({
  getAllMatches: vi.fn(),
  createMatch: vi.fn(),
  addMatchScore: vi.fn(),
}));

describe("Matches API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/matches", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("UNAUTHORIZED"));

      const req = new Request("http://localhost:3000/api/matches");
      const res = await getMatches(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 if user is a scout or player", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new Request("http://localhost:3000/api/matches");
      const res = await getMatches(req);
      expect(res.status).toBe(403);
    });

    it("returns matches list when authenticated as coach", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      vi.mocked(matchService.getAllMatches).mockResolvedValue([
        { _id: "m-1", opponent: "Rivals FC" } as any,
      ]);

      const req = new Request("http://localhost:3000/api/matches");
      const res = await getMatches(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.matches).toHaveLength(1);
    });
  });

  describe("POST /api/matches", () => {
    it("returns 400 on invalid input", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      const req = new Request("http://localhost:3000/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: "invalid-date",
          sportId: "",
          opponent: "",
        }),
      });

      const res = await createMatchRoute(req);
      expect(res.status).toBe(400);
    });

    it("creates a match and returns 201", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      const mockMatch = {
        _id: "m-1",
        dateKey: "2026-11-02",
        sport: "sport-football",
        opponent: "St. Xavier's",
      };
      vi.mocked(matchService.createMatch).mockResolvedValue(mockMatch as any);

      const req = new Request("http://localhost:3000/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: "2026-11-02",
          sportId: "sport-football",
          opponent: "St. Xavier's",
        }),
      });

      const res = await createMatchRoute(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.match.opponent).toBe("St. Xavier's");
    });
  });

  describe("POST /api/matches/[id]/scores", () => {
    it("returns 400 when player is not eligible for scoring", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      vi.mocked(matchService.addMatchScore).mockRejectedValue(
        new AppError("Player is not eligible: Player was absent", 400)
      );

      const req = new Request("http://localhost:3000/api/matches/m-1/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "player-1",
          primaryScore: 2,
        }),
      });

      const context = { params: Promise.resolve({ id: "m-1" }) };
      const res = await addScoreRoute(req, context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Player is not eligible");
    });

    it("records score and returns 201 when eligible", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      const mockScore = {
        _id: "sc-1",
        primaryScore: 3,
        player: "player-1",
      };
      vi.mocked(matchService.addMatchScore).mockResolvedValue(mockScore as any);

      const req = new Request("http://localhost:3000/api/matches/m-1/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "player-1",
          primaryScore: 3,
        }),
      });

      const context = { params: Promise.resolve({ id: "m-1" }) };
      const res = await addScoreRoute(req, context);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.score.primaryScore).toBe(3);
    });

    it("accepts player and score aliases ({ player, score }) and returns 201", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      const mockScore = {
        _id: "sc-2",
        primaryScore: 4,
        player: "player-2",
      };
      vi.mocked(matchService.addMatchScore).mockResolvedValue(mockScore as any);

      const req = new Request("http://localhost:3000/api/matches/m-1/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: "player-2",
          score: 4,
        }),
      });

      const context = { params: Promise.resolve({ id: "m-1" }) };
      const res = await addScoreRoute(req, context);
      expect(res.status).toBe(201);
      expect(matchService.addMatchScore).toHaveBeenCalledWith({
        matchId: "m-1",
        playerId: "player-2",
        primaryScore: 4,
        stats: undefined,
        createdBy: "coach-1",
      });
    });
  });
});
