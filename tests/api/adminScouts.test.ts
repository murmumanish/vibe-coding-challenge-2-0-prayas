// tests/api/adminScouts.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getScoutsRoute, POST as postScoutRoute } from "@/app/api/admin/scouts/route";
import { PATCH as patchScoutRoute } from "@/app/api/admin/scouts/[id]/route";
import * as auth from "@/lib/auth";
import * as scoutService from "@/services/scout.service";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/scout.service", () => ({
  getAllScouts: vi.fn(),
  getScoutById: vi.fn(),
  assignSportsToScout: vi.fn(),
  createScout: vi.fn(),
}));

describe("Admin Scouts API & Sports Assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/scouts", () => {
    it("rejects non-admin with 403 Forbidden", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const res = await getScoutsRoute(new Request("http://localhost:3000/api/admin/scouts"));
      expect(res.status).toBe(403);
      expect(auth.requireRole).toHaveBeenCalledWith("admin");
    });

    it("allows admin to fetch scouts list", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(scoutService.getAllScouts).mockResolvedValue([
        {
          _id: "sc-1",
          name: "Scout Vikram",
          email: "scout@academy.com",
          role: "scout",
          isActive: true,
          assignedSports: [{ _id: "s-1", name: "Cricket" }],
        } as any,
      ]);

      const res = await getScoutsRoute(new Request("http://localhost:3000/api/admin/scouts"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.scouts).toHaveLength(1);
      expect(data.scouts[0].assignedSports[0].name).toBe("Cricket");
    });
  });

  describe("PATCH /api/admin/scouts/[id] (Assign Sports to Scout)", () => {
    it("rejects non-admin from assigning sports with 403 Forbidden", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const res = await patchScoutRoute(
        new Request("http://localhost:3000/api/admin/scouts/sc-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sportIds: ["s-1"] }),
        }),
        { params: Promise.resolve({ id: "sc-1" }) }
      );
      expect(res.status).toBe(403);
    });

    it("rejects request if sportIds is not an array", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });

      const res = await patchScoutRoute(
        new Request("http://localhost:3000/api/admin/scouts/sc-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sportIds: "invalid" }),
        }),
        { params: Promise.resolve({ id: "sc-1" }) }
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("sportIds must be an array");
    });

    it("allows admin to successfully assign sports to scout", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(scoutService.assignSportsToScout).mockResolvedValue({
        _id: "sc-1",
        name: "Scout Vikram",
        email: "scout@academy.com",
        role: "scout",
        assignedSports: [{ _id: "s-1", name: "Cricket" }],
      } as any);

      const res = await patchScoutRoute(
        new Request("http://localhost:3000/api/admin/scouts/sc-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sportIds: ["s-1"] }),
        }),
        { params: Promise.resolve({ id: "sc-1" }) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.scout.assignedSports).toHaveLength(1);
    });
  });

  describe("POST /api/admin/scouts (Enroll Scout Account)", () => {
    it("rejects non-admin from creating scout account with 403 Forbidden", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const res = await postScoutRoute(
        new Request("http://localhost:3000/api/admin/scouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Scout Test", email: "scout@test.com" }),
        })
      );
      expect(res.status).toBe(403);
    });

    it("rejects request if scout name is missing", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });

      const res = await postScoutRoute(
        new Request("http://localhost:3000/api/admin/scouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "", email: "scout@test.com" }),
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Scout name is required");
    });

    it("rejects request if scout email is missing", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });

      const res = await postScoutRoute(
        new Request("http://localhost:3000/api/admin/scouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Scout Test", email: "" }),
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Scout email is required");
    });

    it("allows admin to create scout account with assigned sports", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "admin-1",
        email: "admin@academy.com",
        role: "admin",
      });
      vi.mocked(scoutService.createScout).mockResolvedValue({
        _id: "sc-new",
        name: "Vikram Scout",
        email: "vikram.scout@academy.com",
        role: "scout",
        assignedSports: ["s-1"],
      } as any);

      const res = await postScoutRoute(
        new Request("http://localhost:3000/api/admin/scouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Vikram Scout",
            email: "vikram.scout@academy.com",
            password: "scoutPassword123",
            sportIds: ["s-1"],
          }),
        })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.scout.role).toBe("scout");
    });
  });
});
