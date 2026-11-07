// src/app/api/players/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { createPlayerSchema } from "@/lib/validators";
import { getAllPlayers, createPlayer } from "@/services/player.service";

export const GET = withHandler(async (request: Request) => {
  // Both coaches and admin can query players roster
  await requireRole("coach", "admin");

  const url = new URL(request.url);
  const sportId = url.searchParams.get("sportId") || undefined;
  const activeOnly = url.searchParams.get("activeOnly") === "true";

  const players = await getAllPlayers({ sportId, activeOnly });
  return NextResponse.json({ players });
});

export const POST = withHandler(async (request: Request) => {
  // Only Academy Owner (Admin) can register new students/players
  await requireRole("admin");

  const body = await request.json();
  const parsed = createPlayerSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const player = await createPlayer(parsed.data);
  return NextResponse.json({ player }, { status: 201 });
});
