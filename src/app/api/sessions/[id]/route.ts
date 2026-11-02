// src/app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler } from "@/lib/errors";
import { getSession } from "@/lib/auth";
import { getSessionWithAttendance } from "@/services/session.service";

export const GET = withHandler(
  async (_request: Request, context?: unknown) => {
    const session = await getSession();
    if (!session) {
      throw new Error("UNAUTHORIZED");
    }

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const result = await getSessionWithAttendance(id);
    return NextResponse.json(result);
  }
);
