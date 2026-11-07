// src/app/api/players/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole, getSession } from "@/lib/auth";
import {
  getPlayerById,
  togglePlayerActive,
  getPlayerAttendanceStats,
} from "@/services/player.service";

export const GET = withHandler(
  async (_request: Request, context?: unknown) => {
    const session = await getSession();
    if (!session) {
      throw new Error("UNAUTHORIZED");
    }

    // Access control:
    // Scout: forbidden from direct player endpoints (must use /api/ready)
    if (session.role === "scout") {
      throw new AppError("Forbidden: Scouts cannot view player rosters directly", 403);
    }

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const player = await getPlayerById(id);

    // Player: only own record
    if (session.role === "player") {
      if (!player.userId || player.userId.toString() !== session.userId) {
        throw new AppError("Forbidden: Cannot view other players", 403);
      }
    }

    let stats = null;
    if (typeof getPlayerAttendanceStats === "function") {
      try {
        stats = await getPlayerAttendanceStats(id);
      } catch {
        stats = null;
      }
    }

    return NextResponse.json({ player, stats });
  }
);

export const PATCH = withHandler(
  async (_request: Request, context?: unknown) => {
    // Only Academy Owner (Admin) can toggle player active status
    await requireRole("admin");

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const player = await togglePlayerActive(id);
    return NextResponse.json({ player });
  }
);
