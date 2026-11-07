// tests/api/sportsPublic.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getPublicSportsRoute } from "@/app/api/sports/public/route";
import Sport from "@/models/Sport";

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Sport", () => ({
  default: {
    find: vi.fn(),
  },
}));

describe("GET /api/sports/public", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only name and slug for active sports sorted by name", async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { name: "Badminton", slug: "badminton" },
        { name: "Cricket", slug: "cricket" },
        { name: "Football", slug: "football" },
      ]),
    };

    (Sport.find as any).mockReturnValue(mockQuery);

    const res = await getPublicSportsRoute();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Sport.find).toHaveBeenCalledWith({ isActive: true });
    expect(mockQuery.select).toHaveBeenCalledWith("name slug -_id");
    expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
    expect(data).toEqual([
      { name: "Badminton", slug: "badminton" },
      { name: "Cricket", slug: "cricket" },
      { name: "Football", slug: "football" },
    ]);
  });

  it("returns empty array if no active sports exist", async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };

    (Sport.find as any).mockReturnValue(mockQuery);

    const res = await getPublicSportsRoute();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("handles db error gracefully with 500 status", async () => {
    (Sport.find as any).mockImplementation(() => {
      throw new Error("DB Connection Failed");
    });

    const res = await getPublicSportsRoute();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to fetch sports");
  });
});
