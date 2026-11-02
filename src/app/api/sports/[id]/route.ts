// src/app/api/sports/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { toggleSportStatus } from "@/services/sport.service";

export const PATCH = withHandler(
  async (_request: Request, context?: unknown) => {
    await requireRole("coach");
    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const sport = await toggleSportStatus(id);
    return NextResponse.json({ sport });
  }
);
