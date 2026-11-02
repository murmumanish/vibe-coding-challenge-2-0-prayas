// src/app/api/sessions/[id]/attendance/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { updateAttendanceSchema, batchAttendanceSchema } from "@/lib/validators";
import { markAttendance, markBatchAttendance } from "@/services/session.service";

async function handleAttendanceUpdate(request: Request, context?: unknown) {
  const authUser = await requireRole("coach");
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;

  const body = await request.json();

  // Support batch attendance update: { attendances: [{ playerId, status }, ...] }
  if (Array.isArray(body.attendances)) {
    const parsed = batchAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid batch attendance payload", 400);
    }
    const result = await markBatchAttendance(
      id,
      parsed.data.attendances,
      authUser.userId
    );
    return NextResponse.json(result);
  }

  // Support single attendance toggle: { playerId, status }
  const parsed = updateAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message || "Invalid attendance payload", 400);
  }

  const attendance = await markAttendance(
    id,
    parsed.data.playerId,
    parsed.data.status,
    authUser.userId
  );

  return NextResponse.json({ attendance });
}

export const PUT = withHandler(handleAttendanceUpdate);
export const POST = withHandler(handleAttendanceUpdate);
export const PATCH = withHandler(handleAttendanceUpdate);
