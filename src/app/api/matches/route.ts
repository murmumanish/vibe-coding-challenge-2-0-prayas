// src/app/api/matches/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { getSession, requireRole } from "@/lib/auth";
import { createMatchSchema } from "@/lib/validators";
import { getAllMatches, createMatch } from "@/services/match.service";

export const GET = withHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const url = new URL(request.url);
  const sportId = url.searchParams.get("sportId") || undefined;
  const dateKey = url.searchParams.get("dateKey") || undefined;

  const matches = await getAllMatches({ sportId, dateKey });
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
