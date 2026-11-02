import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getSessions, POST as createSessionRoute } from "@/app/api/sessions/route";
import { PUT as updateAttendance } from "@/app/api/sessions/[id]/attendance/route";
import { POST as closeSessionRoute } from "@/app/api/sessions/[id]/close/route";
import * as auth from "@/lib/auth";
import * as sessionService from "@/services/session.service";
import { AppError } from "@/lib/errors";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/session.service", () => ({
  getAllSessions: vi.fn(),
  createSession: vi.fn(),
  markAttendance: vi.fn(),
  markBatchAttendance: vi.fn(),
  closeSession: vi.fn(),
}));

describe("Sessions API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/sessions", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("UNAUTHORIZED"));

      const request = new Request("http://localhost:3000/api/sessions");
      const res = await getSessions(request);
      expect(res.status).toBe(401);
    });

    it("returns 403 if user is a scout", async () => {
      vi.mocked(auth.requireRole).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new Request("http://localhost:3000/api/sessions");
      const res = await getSessions(request);
      expect(res.status).toBe(403);
    });

    it("returns sessions list when authenticated as coach", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      vi.mocked(sessionService.getAllSessions).mockResolvedValue([
        { _id: "sess-1", dateKey: "2026-11-02", status: "open" } as any,
      ]);

      const request = new Request("http://localhost:3000/api/sessions");
      const res = await getSessions(request);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sessions).toHaveLength(1);
    });
  });

  describe("POST /api/sessions", () => {
    it("returns 400 if validation fails", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      const request = new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: "invalid-date",
          sportId: "",
        }),
      });

      const res = await createSessionRoute(request);
      expect(res.status).toBe(400);
    });

    it("creates a session and returns 201", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      const mockSession = {
        _id: "sess-1",
        dateKey: "2026-11-02",
        sport: "sport-football",
        status: "open",
      };
      vi.mocked(sessionService.createSession).mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: "2026-11-02",
          sportId: "sport-football",
        }),
      });

      const res = await createSessionRoute(request);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.session).toEqual(mockSession);
    });
  });

  describe("PUT /api/sessions/[id]/attendance", () => {
    it("updates player attendance", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      vi.mocked(sessionService.markAttendance).mockResolvedValue({
        _id: "att-1",
        status: "present",
      } as any);

      const request = new Request("http://localhost:3000/api/sessions/sess-1/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "player-1",
          status: "present",
        }),
      });

      const context = { params: Promise.resolve({ id: "sess-1" }) };
      const res = await updateAttendance(request, context);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.attendance.status).toBe("present");
    });

    it("returns 400 when session is closed", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      vi.mocked(sessionService.markAttendance).mockRejectedValue(
        new AppError("Cannot edit attendance for a closed session", 400)
      );

      const request = new Request("http://localhost:3000/api/sessions/sess-1/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "player-1",
          status: "present",
        }),
      });

      const context = { params: Promise.resolve({ id: "sess-1" }) };
      const res = await updateAttendance(request, context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Cannot edit attendance for a closed session");
    });
  });

  describe("POST /api/sessions/[id]/close", () => {
    it("locks session and returns 200", async () => {
      vi.mocked(auth.requireRole).mockResolvedValue({
        userId: "coach-1",
        email: "coach@academy.com",
        role: "coach",
      });

      const closedSession = {
        _id: "sess-1",
        status: "closed",
        closedAt: new Date(),
      };
      vi.mocked(sessionService.closeSession).mockResolvedValue(closedSession as any);

      const request = new Request("http://localhost:3000/api/sessions/sess-1/close", {
        method: "POST",
      });

      const context = { params: Promise.resolve({ id: "sess-1" }) };
      const res = await closeSessionRoute(request, context);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.session.status).toBe("closed");
    });
  });
});
