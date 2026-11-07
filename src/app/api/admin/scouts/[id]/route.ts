// src/app/api/admin/scouts/[id]/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { assignSportsToScout } from "@/services/scout.service";

export const PATCH = withHandler(
  async (request: Request, context?: unknown) => {
    await requireRole("admin");

    const { params } = context as { params: Promise<{ id: string }> };
    const { id } = await params;

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      throw new AppError("Invalid JSON body", 400);
    }

    if (!Array.isArray(body.sportIds)) {
      throw new AppError("sportIds must be an array of sport IDs", 400);
    }

    const updatedScout = await assignSportsToScout(id, body.sportIds);
    return NextResponse.json({ scout: updatedScout });
  }
);
