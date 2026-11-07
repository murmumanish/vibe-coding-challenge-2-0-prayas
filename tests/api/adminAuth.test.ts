// tests/api/adminAuth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postSportRoute } from "@/app/api/sports/route";
import { PATCH as patchSportRoute } from "@/app/api/sports/[id]/route";
import { POST as postPlayerRoute, GET as getPlayersRoute } from "@/app/api/players/route";
import { PATCH as patchPlayerRoute } from "@/app/api/players/[id]/route";
import * as auth from "@/lib/auth";
import * as sportService from "@/services/sport.service";
import * as playerService from "@/services/player.service";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/sport.service", () => ({
  createSport: vi.fn(),
  getAllSports: vi.fn(),
  getSportPresets: vi.fn(),
  toggleSportStatus: vi.fn(),
  addScoreFieldToSport: vi.fn(),
}));

vi.mock("@/services/player.service", () => ({
  createPlayer: vi.fn(),
  getAllPlayers: vi.fn(),
  getPlayerById: vi.fn(),
  togglePlayerActive: vi.fn(),
  getPlayerAttendanceStats: vi.fn(),
}));

describe("Admin Authority & Route Permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/sports (Add Sports)", () => {
    it("rejects coach with 403 Forbidden because only Admin can add sports", async () => {
      vi.mocked(auth.requireRole).mockImplementation(async (...roles) => {
        if (!roles.includes("coach" as any)) {
          throw new Error("FORBIDDEN");
        }
        return { userId: "c-1", email: "coach@academy.com", role: "coach" };
      });

      const req = new Request("http://localhost:3000/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetSlug: "cricket" }),
      });

      const res = await postSportRoute(req);
      expect(res.status).toBe(403);
      expect(auth.requireRole).toHaveBeenCalledWith("admin");
    });

    it("allows admin to add sports", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(sportService.createSport).mockResolvedValue({
        _id: "s-1",
        name: "Cricket",
        slug: "cricket",
      } as any);

      const req = new Request("http://localhost:3000/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetSlug: "cricket" }),
      });

      const res = await postSportRoute(req);
      expect(res.status).toBe(201);
      expect(sportService.createSport).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/sports/[id] (Archive or modify sports)", () => {
    it("rejects coach with 403 Forbidden", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new Request("http://localhost:3000/api/sports/s-1", {
        method: "PATCH",
      });

      const res = await patchSportRoute(req, {
        params: Promise.resolve({ id: "s-1" }),
      });
      expect(res.status).toBe(403);
      expect(auth.requireRole).toHaveBeenCalledWith("admin");
    });

    it("allows admin to toggle sport status", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(sportService.toggleSportStatus).mockResolvedValue({
        _id: "s-1",
        name: "Cricket",
        isActive: false,
      } as any);

      const req = new Request("http://localhost:3000/api/sports/s-1", {
        method: "PATCH",
      });

      const res = await patchSportRoute(req, {
        params: Promise.resolve({ id: "s-1" }),
      });
      expect(res.status).toBe(200);
      expect(sportService.toggleSportStatus).toHaveBeenCalledWith("s-1");
    });
  });

  describe("POST /api/players (Add Students / Players)", () => {
    it("rejects coach with 403 Forbidden because only Admin can enroll students", async () => {
      vi.mocked(auth.requireRole).mockImplementation(async (...roles) => {
        if (!roles.includes("coach" as any)) {
          throw new Error("FORBIDDEN");
        }
        return { userId: "c-1", email: "coach@academy.com", role: "coach" };
      });

      const req = new Request("http://localhost:3000/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rohan Kumar",
          age: 16,
          sportId: "sport-123",
        }),
      });

      const res = await postPlayerRoute(req);
      expect(res.status).toBe(403);
      expect(auth.requireRole).toHaveBeenCalledWith("admin");
    });

    it("allows admin to enroll a new student", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(playerService.createPlayer).mockResolvedValue({
        _id: "p-1",
        name: "Rohan Kumar",
        age: 16,
        sport: "sport-123",
        isActive: true,
      } as any);

      const req = new Request("http://localhost:3000/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rohan Kumar",
          age: 16,
          sportId: "sport-123",
        }),
      });

      const res = await postPlayerRoute(req);
      expect(res.status).toBe(201);
      expect(playerService.createPlayer).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/players/[id] (Modify or toggle player active status)", () => {
    it("rejects coach with 403 Forbidden because only Admin can modify player status", async () => {
      vi.mocked(auth.requireRole).mockImplementation(async (...roles) => {
        if (!roles.includes("coach" as any)) {
          throw new Error("FORBIDDEN");
        }
        return { userId: "c-1", email: "coach@academy.com", role: "coach" };
      });

      const req = new Request("http://localhost:3000/api/players/p-1", {
        method: "PATCH",
      });

      const res = await patchPlayerRoute(req, {
        params: Promise.resolve({ id: "p-1" }),
      });
      expect(res.status).toBe(403);
      expect(auth.requireRole).toHaveBeenCalledWith("admin");
    });

    it("allows admin to toggle player status", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(playerService.togglePlayerActive).mockResolvedValue({
        _id: "p-1",
        name: "Rohan Kumar",
        isActive: false,
      } as any);

      const req = new Request("http://localhost:3000/api/players/p-1", {
        method: "PATCH",
      });

      const res = await patchPlayerRoute(req, {
        params: Promise.resolve({ id: "p-1" }),
      });
      expect(res.status).toBe(200);
      expect(playerService.togglePlayerActive).toHaveBeenCalledWith("p-1");
    });
  });

  describe("GET /api/players (View Student Directory)", () => {
    it("allows both coach and admin to view players list", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "c-1",
        email: "coach@academy.com",
        role: "coach",
      });
      vi.mocked(playerService.getAllPlayers).mockResolvedValue([]);

      const req = new Request("http://localhost:3000/api/players");
      const res = await getPlayersRoute(req);
      expect(res.status).toBe(200);
      expect(auth.requireRole).toHaveBeenCalledWith("coach", "admin");
    });
  });
});
