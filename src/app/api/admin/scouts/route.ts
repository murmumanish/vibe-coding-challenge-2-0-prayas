// src/app/api/admin/scouts/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { getAllScouts, createScout } from "@/services/scout.service";

export const GET = withHandler(async () => {
  await requireRole("admin");
  const scouts = await getAllScouts();
  return NextResponse.json({ scouts });
});

export const POST = withHandler(async (request: Request) => {
  await requireRole("admin");

  const body = await request.json();
  if (!body.name || !body.name.trim()) {
    throw new AppError("Scout name is required", 400);
  }
  if (!body.email || !body.email.trim()) {
    throw new AppError("Scout email is required", 400);
  }

  const scout = await createScout({
    name: body.name,
    email: body.email,
    password: body.password,
    sportIds: body.sportIds,
  });

  return NextResponse.json({ scout }, { status: 201 });
});
