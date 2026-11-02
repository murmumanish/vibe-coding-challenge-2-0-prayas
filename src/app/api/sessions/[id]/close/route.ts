// src/app/api/sessions/[id]/close/route.ts
import { NextResponse } from "next/server";
import { withHandler } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { closeSession } from "@/services/session.service";

export const POST = withHandler(
  async (_request: Request, context?: unknown) => {
    await requireRole("coach");
    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    const session = await closeSession(id);
    return NextResponse.json({ session });
  }
);
