// tests/services/coach.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllCoaches,
  getCoachById,
  assignSportsToCoach,
  getCoachAssignedSports,
  createCoach,
} from "@/services/coach.service";
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

describe("Coach Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllCoaches", () => {
    it("fetches all coaches populated with assignedSports", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: "c-1", name: "Coach Rahul", role: "coach", assignedSports: [] },
        ]),
      };
      vi.mocked(User.find).mockReturnValue(mockQuery as any);

      const coaches = await getAllCoaches();
      expect(dbConnect).toHaveBeenCalled();
      expect(User.find).toHaveBeenCalledWith({ role: "coach" });
      expect(coaches).toHaveLength(1);
    });
  });

  describe("getCoachById", () => {
    it("returns coach details if found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: "c-1",
          name: "Coach Rahul",
          role: "coach",
          assignedSports: [{ _id: "s-1", name: "Cricket" }],
        }),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      const coach = await getCoachById("c-1");
      expect(coach.name).toBe("Coach Rahul");
    });

    it("throws 404 AppError if coach does not exist", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      await expect(getCoachById("non-existent")).rejects.toThrow("Coach not found");
    });
  });

  describe("assignSportsToCoach", () => {
    it("assigns valid verified sports to coach", async () => {
      const validSportId1 = new Types.ObjectId();
      const validSportId2 = new Types.ObjectId();

      const mockCoach = {
        _id: "c-1",
        name: "Coach Rahul",
        role: "coach",
        assignedSports: [],
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(User.findOne).mockResolvedValue(mockCoach as any);

      vi.mocked(Sport.find).mockResolvedValue([
        { _id: validSportId1, name: "Cricket", isActive: true },
        { _id: validSportId2, name: "Football", isActive: true },
      ] as any);

      const mockUpdatedCoach = {
        _id: "c-1",
        name: "Coach Rahul",
        assignedSports: [
          { _id: validSportId1, name: "Cricket" },
          { _id: validSportId2, name: "Football" },
        ],
      };
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockUpdatedCoach),
      };
      vi.mocked(User.findById).mockReturnValue(mockQuery as any);

      const result = await assignSportsToCoach("c-1", [
        validSportId1.toString(),
        validSportId2.toString(),
      ]);

      expect(mockCoach.save).toHaveBeenCalled();
      expect(result?.assignedSports).toHaveLength(2);
    });
  });

  describe("getCoachAssignedSports", () => {
    it("returns active assigned sports for coach", async () => {
      const sport1 = { _id: "s-1", name: "Cricket", isActive: true };
      const sport2 = { _id: "s-2", name: "Archived Sport", isActive: false };

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: "c-1",
          role: "coach",
          assignedSports: [sport1, sport2],
        }),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      const sports = await getCoachAssignedSports("c-1");
      expect(sports).toHaveLength(1);
      expect(sports[0].name).toBe("Cricket");
    });

    it("returns empty array if coach has no assigned sports", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: "c-1",
          role: "coach",
          assignedSports: [],
        }),
      };
      vi.mocked(User.findOne).mockReturnValue(mockQuery as any);

      const sports = await getCoachAssignedSports("c-1");
      expect(sports).toEqual([]);
    });
  });

  describe("createCoach", () => {
    it("creates a new coach with hashed password", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(User.create).mockResolvedValue({
        _id: "c-new",
        name: "Coach Priya",
        email: "priya@academy.com",
        role: "coach",
        assignedSports: [],
      } as any);

      const coach = await createCoach({
        name: "Coach Priya",
        email: "priya@academy.com",
        password: "secretpassword",
      });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Coach Priya",
          email: "priya@academy.com",
          role: "coach",
        })
      );
      expect(coach.name).toBe("Coach Priya");
    });

    it("throws 409 if coach email already exists", async () => {
      vi.mocked(User.findOne).mockResolvedValue({ _id: "existing" } as any);

      await expect(
        createCoach({
          name: "Coach Duplicate",
          email: "duplicate@academy.com",
        })
      ).rejects.toThrow("An account with this email already exists");
    });
  });
});
