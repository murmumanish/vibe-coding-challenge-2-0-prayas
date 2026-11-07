// src/app/api/admin/coaches/route.ts
import { NextResponse } from "next/server";
import { withHandler, AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { getAllCoaches, createCoach } from "@/services/coach.service";

export const GET = withHandler(async () => {
  await requireRole("admin");
  const coaches = await getAllCoaches();
  return NextResponse.json({ coaches });
});

export const POST = withHandler(async (request: Request) => {
  await requireRole("admin");

  const body = await request.json();
  if (!body.name || !body.name.trim()) {
    throw new AppError("Coach name is required", 400);
  }
  if (!body.email || !body.email.trim()) {
    throw new AppError("Coach email is required", 400);
  }

  const coach = await createCoach({
    name: body.name,
    email: body.email,
    password: body.password,
    sportIds: body.sportIds,
  });

  return NextResponse.json({ coach }, { status: 201 });
});
