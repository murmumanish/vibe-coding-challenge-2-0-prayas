// src/app/api/matches/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { createMatchSchema, monthParamSchema } from "@/lib/validators";
import { getAllMatches, createMatch } from "@/services/match.service";
import { getCurrentISTMonth, isFutureMonth } from "@/lib/monthUtils";

export const GET = withHandler(async (request: Request) => {
  const authUser = await requireRole("coach", "admin", "player");

  const url = new URL(request.url);
  const sportParam = url.searchParams.get("sport") || url.searchParams.get("sportId") || undefined;
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

  const matches = await getAllMatches(
    { sport: sportParam, sportId: sportParam, dateKey, month },
    authUser
  );
  return NextResponse.json({ matches });
});

export const POST = withHandler(async (request: Request) => {
  const authUser = await requireRole("coach");

  const body = await request.json();
  const parsed = createMatchSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message || "Invalid match input", 400);
  }

  const match = await createMatch({
    dateKey: parsed.data.dateKey,
    sportId: parsed.data.sportId,
    opponent: parsed.data.opponent,
    location: parsed.data.location,
    createdBy: authUser.userId,
  });

  return NextResponse.json({ match }, { status: 201 });
});
