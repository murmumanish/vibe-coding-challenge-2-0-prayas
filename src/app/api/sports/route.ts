// src/app/api/sports/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { createSportSchema } from "@/lib/validators";
import { getAllSports, createSport } from "@/services/sport.service";

export const GET = withHandler(async (request: Request) => {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get("activeOnly") === "true";
  const sports = await getAllSports(activeOnly);
  return NextResponse.json({ sports });
});

export const POST = withHandler(async (request: Request) => {
  await requireRole("coach");

  const body = await request.json();
  const parsed = createSportSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const sport = await createSport(parsed.data.name);
  return NextResponse.json({ sport }, { status: 201 });
});
