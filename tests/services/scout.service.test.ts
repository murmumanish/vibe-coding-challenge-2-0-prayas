// tests/services/scout.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllScouts,
  getScoutById,
  assignSportsToScout,
  getScoutAssignedSports,
  createScout,
} from "@/services/scout.service";
import User from "@/models/User";
import Sport from "@/models/Sport";
import { dbConnect } from "@/lib/db";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn(),
}));

vi.mock("@/models/User", () => {
  const mockUser: any = {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
  };
  return { default: mockUser };
});

vi.mock("@/models/Sport", () => {
  const mockSport: any = {
    find: vi.fn(),
    findById: vi.fn(),
  };
  return { default: mockSport };
});

vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed_password_123"),
}));

describe("Scout Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllScouts", () => {
    it("fetches all scouts populated with assignedSports", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: "sc-1", name: "Scout Vikram", role: "scout", assignedSports: [] },
        ]),
      };
      vi.mocked(User.find).mockReturnValue(mockQuery as any);

      const scouts = await getAllScouts();
      expect(dbConnect).toHaveBeenCalled();
      expect(User.find).toHaveBeenCalledWith({ role: "scout" });
      expect(scouts).toHaveLength(1);
    });
  });

  describe("getScoutById", () => {
    it("returns scout details if found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: "sc-1",
          name: "Scout Vikram",
          role: "scout",
          assignedSports: [],
        }),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      const scout = await getScoutById("sc-1");
      expect(scout._id).toBe("sc-1");
    });

    it("throws 404 AppError when scout is not found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      await expect(getScoutById("nonexistent")).rejects.toThrow("Scout not found");
    });
  });

  describe("assignSportsToScout", () => {
    it("throws 404 if scout does not exist", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(
        assignSportsToScout("nonexistent", ["66e000000000000000000001"])
      ).rejects.toThrow("Scout not found");
    });

    it("verifies sports and assigns them to scout", async () => {
      const validSportId = new Types.ObjectId();
      const mockScoutDoc: any = {
        _id: "sc-1",
        name: "Scout Vikram",
        role: "scout",
        assignedSports: [],
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(User.findOne).mockResolvedValue(mockScoutDoc);
      vi.mocked(Sport.find).mockResolvedValue([{ _id: validSportId, name: "Cricket" }] as any);

      const mockPopulatedQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: "sc-1",
          name: "Scout Vikram",
          assignedSports: [{ _id: validSportId, name: "Cricket" }],
        }),
      };
      vi.mocked(User.findById).mockReturnValue(mockPopulatedQuery as any);

      const updated = await assignSportsToScout("sc-1", [validSportId.toString()]);
      expect(mockScoutDoc.save).toHaveBeenCalled();
      expect(updated.assignedSports).toHaveLength(1);
    });
  });

  describe("getScoutAssignedSports", () => {
    it("returns active assigned sports for a scout user", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: "sc-1",
          assignedSports: [
            { _id: "s-1", name: "Cricket", isActive: true },
            { _id: "s-2", name: "Archery", isActive: false },
          ],
        }),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      const sports = await getScoutAssignedSports("sc-1");
      expect(sports).toHaveLength(1);
      expect(sports[0].name).toBe("Cricket");
    });

    it("returns empty array if scout has no assignedSports or is not found", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      const sports = await getScoutAssignedSports("sc-1");
      expect(sports).toEqual([]);
    });
  });

  describe("createScout", () => {
    it("throws 409 if email already exists", async () => {
      vi.mocked(User.findOne).mockResolvedValue({ _id: "existing" } as any);

      await expect(
        createScout({ name: "Duplicate", email: "existing@academy.com" })
      ).rejects.toThrow("An account with this email already exists");
    });

    it("throws 400 if custom password is less than 6 chars", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(
        createScout({
          name: "Short Pwd",
          email: "short@academy.com",
          password: "123",
        })
      ).rejects.toThrow("Password must be at least 6 characters");
    });

    it("creates scout user with hashed password and assigned sports", async () => {
      const validSportId = new Types.ObjectId();
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(Sport.find).mockResolvedValue([{ _id: validSportId, name: "Football" }] as any);
      vi.mocked(User.create).mockResolvedValue({
        _id: "sc-new",
        name: "New Scout",
        email: "newscout@academy.com",
        role: "scout",
        assignedSports: [validSportId],
      } as any);

      const scout = await createScout({
        name: "New Scout",
        email: "newscout@academy.com",
        password: "securePassword123",
        sportIds: [validSportId.toString()],
      });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Scout",
          email: "newscout@academy.com",
          role: "scout",
          password: "hashed_password_123",
        })
      );
      expect(scout.role).toBe("scout");
    });
  });
});
