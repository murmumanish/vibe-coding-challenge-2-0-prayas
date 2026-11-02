// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withHandler } from "@/lib/errors";
import User from "@/models/User";

export const GET = withHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await dbConnect();

  const user = await User.findById(session.userId).select("-password");
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});
