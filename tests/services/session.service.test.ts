import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSession,
  markAttendance,
  markBatchAttendance,
  closeSession,
} from "@/services/session.service";
import Sport from "@/models/Sport";
import Session from "@/models/Session";
import Player from "@/models/Player";
import Attendance from "@/models/Attendance";
import { AppError } from "@/lib/errors";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Sport", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("@/models/Session", () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("@/models/Player", () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("@/models/Attendance", () => ({
  default: {
    insertMany: vi.fn(),
    findOneAndUpdate: vi.fn(),
    bulkWrite: vi.fn(),
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

describe("Session Service", () => {
  const sportId = new Types.ObjectId().toString();
  const coachUserId = new Types.ObjectId().toString();
  const playerId1 = new Types.ObjectId().toString();
  const playerId2 = new Types.ObjectId().toString();
  const sessionId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("throws 404 if sport does not exist", async () => {
      vi.mocked(Sport.findById).mockResolvedValue(null);

      await expect(
        createSession({
          sportId,
          dateKey: "2026-11-02",
          createdBy: coachUserId,
        })
      ).rejects.toThrow("Sport not found");
    });

    it("throws 400 if sport is inactive", async () => {
      vi.mocked(Sport.findById).mockResolvedValue({
        _id: sportId,
        name: "Football",
        isActive: false,
      } as any);

      await expect(
        createSession({
          sportId,
          dateKey: "2026-11-02",
          createdBy: coachUserId,
        })
      ).rejects.toThrow("Cannot create a session for an inactive sport");
    });

    it("throws 409 if session already exists for this sport on the same dateKey", async () => {
      vi.mocked(Sport.findById).mockResolvedValue({
        _id: sportId,
        name: "Football",
        isActive: true,
      } as any);

      vi.mocked(Session.findOne).mockResolvedValue({
        _id: sessionId,
      } as any);

      await expect(
        createSession({
          sportId,
          dateKey: "2026-11-02",
          createdBy: coachUserId,
        })
      ).rejects.toThrow("A session already exists for this sport on this date");
    });

    it("creates session and auto-generates absent attendance rows for all active players", async () => {
      vi.mocked(Sport.findById).mockResolvedValue({
        _id: sportId,
        name: "Football",
        isActive: true,
      } as any);

      vi.mocked(Session.findOne).mockResolvedValue(null);

      const createdSessionObj = {
        _id: sessionId,
        dateKey: "2026-11-02",
        sport: sportId,
        status: "open",
        createdBy: coachUserId,
      };
      vi.mocked(Session.create).mockResolvedValue(createdSessionObj as any);

      // Active players query
      const mockSelect = vi.fn().mockResolvedValue([
        { _id: playerId1 },
        { _id: playerId2 },
      ]);
      vi.mocked(Player.find).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await createSession({
        sportId,
        dateKey: "2026-11-02",
        createdBy: coachUserId,
      });

      expect(Session.create).toHaveBeenCalledWith({
        dateKey: "2026-11-02",
        sport: sportId,
        createdBy: expect.any(Types.ObjectId),
        status: "open",
      });

      expect(Player.find).toHaveBeenCalledWith({
        sport: sportId,
        isActive: true,
      });

      // Attendance rows automatically created as "absent"
      expect(Attendance.insertMany).toHaveBeenCalledWith(
        [
          { session: sessionId, player: playerId1, status: "absent" },
          { session: sessionId, player: playerId2, status: "absent" },
        ],
        { ordered: false }
      );

      expect(result).toEqual(createdSessionObj);
    });
  });

  describe("markAttendance", () => {
    it("throws 404 if session not found", async () => {
      vi.mocked(Session.findById).mockResolvedValue(null);

      await expect(
        markAttendance(sessionId, playerId1, "present", coachUserId)
      ).rejects.toThrow("Session not found");
    });

    it("throws 400 when session is closed", async () => {
      vi.mocked(Session.findById).mockResolvedValue({
        _id: sessionId,
        status: "closed",
        closedAt: new Date(),
      } as any);

      await expect(
        markAttendance(sessionId, playerId1, "present", coachUserId)
      ).rejects.toMatchObject({
        message: "Cannot edit attendance for a closed session",
        statusCode: 400,
      });
    });

    it("toggles player to present when session is open", async () => {
      vi.mocked(Session.findById).mockResolvedValue({
        _id: sessionId,
        status: "open",
      } as any);

      vi.mocked(Player.findById).mockResolvedValue({
        _id: playerId1,
        name: "Lionel Messi",
      } as any);

      const mockPopulate = vi.fn().mockResolvedValue({
        session: sessionId,
        player: { _id: playerId1, name: "Lionel Messi" },
        status: "present",
      });
      vi.mocked(Attendance.findOneAndUpdate).mockReturnValue({
        populate: mockPopulate,
      } as any);

      const result = await markAttendance(
        sessionId,
        playerId1,
        "present",
        coachUserId
      );

      expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
        { session: sessionId, player: playerId1 },
        { status: "present", markedBy: expect.any(Types.ObjectId) },
        { new: true, upsert: true }
      );
      expect(result).toBeDefined();
    });
  });

  describe("closeSession", () => {
    it("locks session and sets closedAt", async () => {
      const mockSession = {
        _id: sessionId,
        status: "open",
        closedAt: undefined,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(Session.findById).mockResolvedValue(mockSession as any);

      const result = await closeSession(sessionId);

      expect(result.status).toBe("closed");
      expect(result.closedAt).toBeInstanceOf(Date);
      expect(mockSession.save).toHaveBeenCalled();
    });

    it("subsequent attendance edits are rejected with 400", async () => {
      vi.mocked(Session.findById).mockResolvedValue({
        _id: sessionId,
        status: "closed",
        closedAt: new Date(),
      } as any);

      try {
        await markAttendance(sessionId, playerId1, "present", coachUserId);
        expect.unreachable("Should have thrown 400 AppError");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe("Cannot edit attendance for a closed session");
      }
    });

    it("subsequent batch attendance edits are also rejected with 400", async () => {
      vi.mocked(Session.findById).mockResolvedValue({
        _id: sessionId,
        status: "closed",
        closedAt: new Date(),
      } as any);

      try {
        await markBatchAttendance(
          sessionId,
          [{ playerId: playerId1, status: "present" }],
          coachUserId
        );
        expect.unreachable("Should have thrown 400 AppError");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe("Cannot edit attendance for a closed session");
      }
    });
  });
});
