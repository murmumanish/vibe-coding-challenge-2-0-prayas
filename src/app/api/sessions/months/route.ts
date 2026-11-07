// src/app/api/sessions/months/route.ts
import { NextResponse } from "next/server";
import { withHandler } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { getSessionMonths } from "@/services/session.service";

export const GET = withHandler(async (request: Request) => {
  const authUser = await requireRole("coach", "admin", "player");

  const url = new URL(request.url);
  const sport = url.searchParams.get("sport") || url.searchParams.get("sportId") || undefined;

  const result = await getSessionMonths({ sport }, authUser);
  return NextResponse.json(result);
});
