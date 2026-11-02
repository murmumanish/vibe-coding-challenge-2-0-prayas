// src/app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { getSessionWithAttendance } from "@/services/session.service";

export const GET = withHandler(
  async (_request: Request, context?: unknown) => {
    await requireRole("coach");

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const result = await getSessionWithAttendance(id);
    return NextResponse.json(result);
  }
);
