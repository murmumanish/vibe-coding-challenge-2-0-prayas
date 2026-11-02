// src/app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { getSession, requireRole } from "@/lib/auth";
import { createSessionSchema } from "@/lib/validators";
import { getAllSessions, createSession } from "@/services/session.service";

export const GET = withHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const url = new URL(request.url);
  const sportId = url.searchParams.get("sportId") || undefined;
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "open" || statusParam === "closed" ? statusParam : undefined;
  const dateKey = url.searchParams.get("dateKey") || undefined;

  const sessions = await getAllSessions({ sportId, status, dateKey });
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
