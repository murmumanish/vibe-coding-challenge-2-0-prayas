// src/app/api/sports/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { toggleSportStatus, addScoreFieldToSport } from "@/services/sport.service";

export const PATCH = withHandler(
  async (request: Request, context?: unknown) => {
    await requireRole("coach");
    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    let body: any = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    if (body?.addScoreField) {
      if (!body.addScoreField.label || !body.addScoreField.label.trim()) {
        throw new AppError("Field label is required", 400);
      }
      const sport = await addScoreFieldToSport(id, body.addScoreField);
      return NextResponse.json({ sport });
    }

    const sport = await toggleSportStatus(id);
    return NextResponse.json({ sport });
  }
);
