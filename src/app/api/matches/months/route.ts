// src/app/api/matches/months/route.ts
import { NextResponse } from "next/server";
import { withHandler } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { getMatchMonths } from "@/services/match.service";

export const GET = withHandler(async (request: Request) => {
  const authUser = await requireRole("coach", "admin", "player");

  const url = new URL(request.url);
  const sport = url.searchParams.get("sport") || url.searchParams.get("sportId") || undefined;

  const result = await getMatchMonths({ sport }, authUser);
  return NextResponse.json(result);
});
