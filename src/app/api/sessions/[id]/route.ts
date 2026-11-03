// src/app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import {
  getSessionWithAttendance,
  updateSessionDate,
} from "@/services/session.service";

export const GET = withHandler(
  async (_request: Request, context?: unknown) => {
    await requireRole("coach");

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const result = await getSessionWithAttendance(id);
    return NextResponse.json(result);
  }
);

export const PATCH = withHandler(
  async (request: Request, context?: unknown) => {
    await requireRole("coach");

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const body = await request.json();
    const { dateKey } = body;

    if (!dateKey || typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new AppError("Invalid date format. Expected YYYY-MM-DD", 400);
    }

    const session = await updateSessionDate(id, dateKey);
    return NextResponse.json({
      session,
      message: "Session date updated successfully",
    });
  }
);
