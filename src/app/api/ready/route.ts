// src/app/api/ready/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { getSession } from "@/lib/auth";
import { getReadinessRoster } from "@/services/readiness.service";

export const GET = withHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  // Access control: Only Coach and Scout can access the readiness roster
  if (session.role !== "coach" && session.role !== "scout") {
    throw new AppError("Forbidden: Access denied to readiness roster", 403);
  }

  const url = new URL(request.url);
  const sportId = url.searchParams.get("sportId") || undefined;

  // Strict role isolation:
  // - Scout sees ONLY Ready players (enforced readyOnly = true)
  // - Coach can see all players or filter by readyOnly
  const isScout = session.role === "scout";
  const readyOnly = isScout
    ? true
    : url.searchParams.get("readyOnly") === "true";

  const players = await getReadinessRoster({ sportId, readyOnly });

  return NextResponse.json({ players });
});
