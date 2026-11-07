// src/app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { createSessionSchema, monthParamSchema } from "@/lib/validators";
import { getAllSessions, createSession } from "@/services/session.service";
import { getCurrentISTMonth, isFutureMonth } from "@/lib/monthUtils";

export const GET = withHandler(async (request: Request) => {
  const authUser = await requireRole("coach", "admin", "player");

  const url = new URL(request.url);
  const sportParam = url.searchParams.get("sport") || url.searchParams.get("sportId") || undefined;
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "open" || statusParam === "closed" ? statusParam : undefined;
  const dateKey = url.searchParams.get("dateKey") || undefined;
  const rawMonth = url.searchParams.get("month") || undefined;

  let month: string | undefined = undefined;
  if (rawMonth) {
    const parsed = monthParamSchema.safeParse(rawMonth);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid month format", 400);
    }
    if (isFutureMonth(rawMonth, getCurrentISTMonth())) {
      throw new AppError("Future month not allowed", 400);
    }
    month = rawMonth;
  }

  const sessions = await getAllSessions(
    { sport: sportParam, sportId: sportParam, status, dateKey, month },
    authUser
  );
  return NextResponse.json({ sessions });
});

export const POST = withHandler(async (request: Request) => {
  const authUser = await requireRole("coach");

  const body = await request.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const newSession = await createSession({
    dateKey: parsed.data.dateKey,
    sportId: parsed.data.sportId,
    createdBy: authUser.userId,
  });

  return NextResponse.json({ session: newSession }, { status: 201 });
});
