import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getReadyRoute } from "@/app/api/ready/route";
import * as auth from "@/lib/auth";
import * as readinessService from "@/services/readiness.service";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/services/readiness.service", () => ({
  getReadinessRoster: vi.fn(),
}));

describe("GET /api/ready Role Access & Views", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthenticated", async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/ready");
    const res = await getReadyRoute(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 Forbidden if user is a player", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      userId: "player-1",
      email: "player@academy.com",
      role: "player",
    });

    const req = new Request("http://localhost:3000/api/ready");
    const res = await getReadyRoute(req);
    expect(res.status).toBe(403);
  });

  it("enforces readyOnly = true for Scout role", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      userId: "scout-1",
      email: "scout@academy.com",
      role: "scout",
    });

    vi.mocked(readinessService.getReadinessRoster).mockResolvedValue([
      { player: { name: "Ready Player" } as any, stats: { isReady: true } as any },
    ]);

    // Even if scout tries to pass readyOnly=false, it must enforce readyOnly=true
    const req = new Request("http://localhost:3000/api/ready?readyOnly=false");
    const res = await getReadyRoute(req);
    expect(res.status).toBe(200);

    // Verify readinessService was called with readyOnly: true
    expect(readinessService.getReadinessRoster).toHaveBeenCalledWith({
      sportId: undefined,
      readyOnly: true,
    });
  });

  it("allows Coach to view all players without readyOnly restriction", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      userId: "coach-1",
      email: "coach@academy.com",
      role: "coach",
    });

    vi.mocked(readinessService.getReadinessRoster).mockResolvedValue([
      { player: { name: "Ready Player" } as any, stats: { isReady: true } as any },
      { player: { name: "Unready Player" } as any, stats: { isReady: false } as any },
    ]);

    const req = new Request("http://localhost:3000/api/ready");
    const res = await getReadyRoute(req);
    expect(res.status).toBe(200);

    expect(readinessService.getReadinessRoster).toHaveBeenCalledWith({
      sportId: undefined,
      readyOnly: false,
    });
  });
});
