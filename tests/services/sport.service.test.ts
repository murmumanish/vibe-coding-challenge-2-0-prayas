import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSport,
  getAllSports,
  getSportPresets,
  toggleSportStatus,
  archiveSport,
} from "@/services/sport.service";
import Sport from "@/models/Sport";
import { SPORT_PRESETS } from "@/domain/sportPresets";
import { AppError } from "@/lib/errors";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Sport", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
  isValidScoreFields: vi.fn((fields) => {
    if (!fields || fields.length === 0) return false;
    const keys = new Set(fields.map((f: any) => f.key));
    if (keys.size !== fields.length) return false;
    const activePrimary = fields.filter((f: any) => f.isPrimary && f.isActive !== false);
    return activePrimary.length === 1 && activePrimary[0].required === true;
  }),
}));

describe("Sport Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSportPresets", () => {
    it("returns presets with isInstalled indicators", async () => {
      vi.mocked(Sport.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { slug: "cricket", isActive: true },
            { slug: "football", isActive: false },
          ]),
        }),
      } as any);

      const presets = await getSportPresets();
      expect(presets.length).toBe(SPORT_PRESETS.length);

      const cricket = presets.find((p) => p.slug === "cricket");
      expect(cricket?.isInstalled).toBe(true);
      expect(cricket?.isActive).toBe(true);

      const kabaddi = presets.find((p) => p.slug === "kabaddi");
      expect(kabaddi?.isInstalled).toBe(false);
      expect(kabaddi?.isActive).toBe(false);
    });
  });

  describe("createSport", () => {
    it("copies a sport from preset with isPreset=true", async () => {
      vi.mocked(Sport.findOne).mockResolvedValue(null);
      const mockCreated = {
        _id: "sport-123",
        name: "Cricket",
        slug: "cricket",
        isPreset: true,
        isActive: true,
      };
      vi.mocked(Sport.create).mockResolvedValue(mockCreated as any);

      const result = await createSport({ presetSlug: "cricket" });
      expect(result).toEqual(mockCreated);
      expect(Sport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Cricket",
          slug: "cricket",
          isPreset: true,
          isActive: true,
          scoreFields: expect.arrayContaining([
            expect.objectContaining({ key: "runs", isPrimary: true }),
          ]),
        })
      );
    });

    it("throws 404 if preset slug is invalid", async () => {
      await expect(
        createSport({ presetSlug: "nonexistent-sport" })
      ).rejects.toThrow("Sport preset not found");
    });

    it("creates a custom sport with primary and secondary scoreFields", async () => {
      vi.mocked(Sport.findOne).mockResolvedValue(null);
      const mockCreated = {
        _id: "sport-custom",
        name: "Archery",
        slug: "archery",
        isPreset: false,
        isActive: true,
      };
      vi.mocked(Sport.create).mockResolvedValue(mockCreated as any);

      const result = await createSport({
        name: "Archery",
        scoreFields: [
          { label: "Points", isPrimary: true, required: true, integer: true },
          { key: "bullsEyes", label: "Bulls-eyes", isPrimary: false, required: false, integer: true },
        ],
      });

      expect(result).toEqual(mockCreated);
      expect(Sport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Archery",
          slug: "archery",
          isPreset: false,
          scoreFields: [
            expect.objectContaining({ key: "points", label: "Points", isPrimary: true }),
            expect.objectContaining({ key: "bullseyes", label: "Bulls-eyes", isPrimary: false }),
          ],
        })
      );
    });

    it("throws 409 if active sport with the same slug already exists", async () => {
      vi.mocked(Sport.findOne).mockResolvedValue({
        _id: "sport-exist",
        name: "Cricket",
        slug: "cricket",
        isActive: true,
      } as any);

      await expect(
        createSport({ presetSlug: "cricket" })
      ).rejects.toThrow("A sport with this name already exists");
    });

    it("reactivates an existing inactive sport with 409 avoided", async () => {
      const mockExisting = {
        _id: "sport-archived",
        name: "Cricket",
        slug: "cricket",
        isActive: false,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(Sport.findOne).mockResolvedValue(mockExisting as any);

      const result = await createSport({ presetSlug: "cricket" });
      expect(mockExisting.isActive).toBe(true);
      expect(mockExisting.save).toHaveBeenCalled();
      expect(result).toBe(mockExisting);
    });
  });

  describe("toggleSportStatus & archiveSport", () => {
    it("toggles sport active flag", async () => {
      const mockSport = {
        _id: "sport-1",
        isActive: true,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(Sport.findById).mockResolvedValue(mockSport as any);

      await toggleSportStatus("sport-1");
      expect(mockSport.isActive).toBe(false);
      expect(mockSport.save).toHaveBeenCalled();
    });

    it("archives a sport setting isActive to false", async () => {
      const mockSport = {
        _id: "sport-2",
        isActive: true,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(Sport.findById).mockResolvedValue(mockSport as any);

      await archiveSport("sport-2");
      expect(mockSport.isActive).toBe(false);
      expect(mockSport.save).toHaveBeenCalled();
    });
  });
});
