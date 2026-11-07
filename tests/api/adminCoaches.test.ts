// tests/api/adminCoaches.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCoachesRoute, POST as postCoachRoute } from "@/app/api/admin/coaches/route";
import { PATCH as patchCoachRoute } from "@/app/api/admin/coaches/[id]/route";
import * as auth from "@/lib/auth";
import * as coachService from "@/services/coach.service";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/coach.service", () => ({
  getAllCoaches: vi.fn(),
  getCoachById: vi.fn(),
  assignSportsToCoach: vi.fn(),
  createCoach: vi.fn(),
}));

describe("Admin Coaches API & Sports Assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/coaches", () => {
    it("rejects non-admin with 403 Forbidden", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const res = await getCoachesRoute(new Request("http://localhost:3000/api/admin/coaches"));
      expect(res.status).toBe(403);
      expect(auth.requireRole).toHaveBeenCalledWith("admin");
    });

    it("allows admin to fetch coaches list", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(coachService.getAllCoaches).mockResolvedValue([
        {
          _id: "c-1",
          name: "Coach Sharma",
          email: "coach@academy.com",
          role: "coach",
          isActive: true,
          assignedSports: [{ _id: "s-1", name: "Cricket" }],
        } as any,
      ]);

      const res = await getCoachesRoute(new Request("http://localhost:3000/api/admin/coaches"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.coaches).toHaveLength(1);
      expect(data.coaches[0].assignedSports[0].name).toBe("Cricket");
    });
  });

  describe("PATCH /api/admin/coaches/[id] (Assign Sports to Coach)", () => {
    it("rejects coach from assigning sports with 403 Forbidden", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new Request("http://localhost:3000/api/admin/coaches/c-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportIds: ["s-cricket", "s-football"] }),
      });

      const res = await patchCoachRoute(req, {
        params: Promise.resolve({ id: "c-1" }),
      });

      expect(res.status).toBe(403);
      expect(auth.requireRole).toHaveBeenCalledWith("admin");
    });

    it("rejects invalid request when sportIds is not an array", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });

      const req = new Request("http://localhost:3000/api/admin/coaches/c-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportIds: "invalid" }),
      });

      const res = await patchCoachRoute(req, {
        params: Promise.resolve({ id: "c-1" }),
      });

      expect(res.status).toBe(400);
    });

    it("allows admin to assign sports to a coach", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(coachService.assignSportsToCoach).mockResolvedValue({
        _id: "c-1",
        name: "Coach Sharma",
        email: "coach@academy.com",
        role: "coach",
        isActive: true,
        assignedSports: [
          { _id: "s-1", name: "Cricket" },
          { _id: "s-2", name: "Football" },
        ],
      } as any);

      const req = new Request("http://localhost:3000/api/admin/coaches/c-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportIds: ["s-1", "s-2"] }),
      });

      const res = await patchCoachRoute(req, {
        params: Promise.resolve({ id: "c-1" }),
      });

      expect(res.status).toBe(200);
      expect(coachService.assignSportsToCoach).toHaveBeenCalledWith("c-1", ["s-1", "s-2"]);
      const data = await res.json();
      expect(data.coach.assignedSports).toHaveLength(2);
    });
  });

  describe("POST /api/admin/coaches (Enroll Coach)", () => {
    it("rejects non-admin with 403 Forbidden", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new Request("http://localhost:3000/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Coach Priya",
          email: "priya@academy.com",
        }),
      });

      const res = await postCoachRoute(req);
      expect(res.status).toBe(403);
    });

    it("creates coach account when called by admin", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(coachService.createCoach).mockResolvedValue({
        _id: "c-2",
        name: "Coach Priya",
        email: "priya@academy.com",
        role: "coach",
        assignedSports: [],
      } as any);

      const req = new Request("http://localhost:3000/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Coach Priya",
          email: "priya@academy.com",
        }),
      });

      const res = await postCoachRoute(req);
      expect(res.status).toBe(201);
      expect(coachService.createCoach).toHaveBeenCalled();
    });
  });
});
