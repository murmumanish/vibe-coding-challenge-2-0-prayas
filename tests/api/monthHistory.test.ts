import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getSessions } from "@/app/api/sessions/route";
import { GET as getMatches } from "@/app/api/matches/route";
import { GET as getSessionMonthsRoute } from "@/app/api/sessions/months/route";
import { GET as getMatchMonthsRoute } from "@/app/api/matches/months/route";
import * as auth from "@/lib/auth";
import * as sessionService from "@/services/session.service";
import * as matchService from "@/services/match.service";

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/services/session.service", () => ({
  getAllSessions: vi.fn(),
  createSession: vi.fn(),
  getSessionMonths: vi.fn(),
}));

vi.mock("@/services/match.service", () => ({
  getAllMatches: vi.fn(),
  createMatch: vi.fn(),
  getMatchMonths: vi.fn(),
}));

describe("Month-based History API Endpoints", () => {
  const coachUser = {
    userId: "coach-123",
    email: "coach@academy.com",
    role: "coach" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.requireRole).mockResolvedValue(coachUser);
  });

  describe("GET /api/sessions month validation", () => {
    it("returns 400 if month param is formatted incorrectly", async () => {
      const req = new Request("http://localhost:3000/api/sessions?month=invalid");
      const res = await getSessions(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/format/i);
    });

    it("returns 400 if month is in the future", async () => {
      const req = new Request("http://localhost:3000/api/sessions?month=2099-01");
      const res = await getSessions(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/future month not allowed/i);
    });

    it("accepts valid past/current month and calls service", async () => {
      vi.mocked(sessionService.getAllSessions).mockResolvedValue([
        { _id: "s1", dateKey: "2026-10-15" } as any,
      ]);

      const req = new Request("http://localhost:3000/api/sessions?month=2026-10&sport=cricket");
      const res = await getSessions(req);
      expect(res.status).toBe(200);
      expect(sessionService.getAllSessions).toHaveBeenCalledWith(
        expect.objectContaining({
          month: "2026-10",
          sport: "cricket",
        }),
        coachUser
      );
    });
  });

  describe("GET /api/matches month validation", () => {
    it("returns 400 if month param is formatted incorrectly", async () => {
      const req = new Request("http://localhost:3000/api/matches?month=2026-13");
      const res = await getMatches(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/format/i);
    });

    it("returns 400 if month is in the future", async () => {
      const req = new Request("http://localhost:3000/api/matches?month=2099-12");
      const res = await getMatches(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/future month not allowed/i);
    });

    it("accepts valid past/current month and calls service", async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue([
        { _id: "m1", dateKey: "2026-10-10" } as any,
      ]);

      const req = new Request("http://localhost:3000/api/matches?month=2026-10&sport=football");
      const res = await getMatches(req);
      expect(res.status).toBe(200);
      expect(matchService.getAllMatches).toHaveBeenCalledWith(
        expect.objectContaining({
          month: "2026-10",
          sport: "football",
        }),
        coachUser
      );
    });
  });

  describe("GET /api/sessions/months", () => {
    it("returns aggregated months and earliest month", async () => {
      vi.mocked(sessionService.getSessionMonths).mockResolvedValue({
        months: [
          { month: "2026-10", count: 12 },
          { month: "2026-09", count: 8 },
        ],
        earliestMonth: "2026-09",
      });

      const req = new Request("http://localhost:3000/api/sessions/months?sport=cricket");
      const res = await getSessionMonthsRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.months).toHaveLength(2);
      expect(json.earliestMonth).toBe("2026-09");
      expect(sessionService.getSessionMonths).toHaveBeenCalledWith(
        { sport: "cricket" },
        coachUser
      );
    });
  });

  describe("GET /api/matches/months", () => {
    it("returns aggregated months and earliest month", async () => {
      vi.mocked(matchService.getMatchMonths).mockResolvedValue({
        months: [
          { month: "2026-10", count: 5 },
          { month: "2026-08", count: 3 },
        ],
        earliestMonth: "2026-08",
      });

      const req = new Request("http://localhost:3000/api/matches/months?sport=football");
      const res = await getMatchMonthsRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.months).toHaveLength(2);
      expect(json.earliestMonth).toBe("2026-08");
      expect(matchService.getMatchMonths).toHaveBeenCalledWith(
        { sport: "football" },
        coachUser
      );
    });
  });
});
