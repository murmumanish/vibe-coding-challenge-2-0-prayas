// src/app/api/players/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole, getSession } from "@/lib/auth";
import { getPlayerById, togglePlayerActive } from "@/services/player.service";

export const GET = withHandler(
  async (_request: Request, context?: unknown) => {
    const session = await getSession();
    if (!session) {
      throw new Error("UNAUTHORIZED");
    }

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const player = await getPlayerById(id);

    // Access control:
    // Coach: allowed
    // Scout: forbidden from direct player endpoints (must use /api/ready)
    // Player: only own record
    if (session.role === "scout") {
      throw new AppError("Forbidden: Scouts cannot view player rosters directly", 403);
    }

    if (session.role === "player") {
      if (!player.userId || player.userId.toString() !== session.userId) {
        throw new AppError("Forbidden: Cannot view other players", 403);
      }
    }

    return NextResponse.json({ player });
  }
);

export const PATCH = withHandler(
  async (_request: Request, context?: unknown) => {
    await requireRole("coach");

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const player = await togglePlayerActive(id);
    return NextResponse.json({ player });
  }
);
