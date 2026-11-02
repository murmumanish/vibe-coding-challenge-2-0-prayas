// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { withHandler } from "@/lib/errors";
import User from "@/models/User";

export const POST = withHandler(async (request: Request) => {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  await dbConnect();

  const user = await User.findOne({
    email: parsed.data.email,
    isActive: true,
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.password);
  if (!passwordValid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = await createToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
});
