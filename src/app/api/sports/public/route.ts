// src/app/api/sports/public/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Sport from "@/models/Sport";

export const revalidate = 3600;

export async function GET() {
  try {
    await dbConnect();
    const sports = await Sport.find({ isActive: true })
      .select("name slug -_id")
      .sort({ name: 1 })
      .lean();

    const publicSports = sports.map((s) => ({
      name: s.name,
      slug: s.slug,
    }));

    return NextResponse.json(publicSports);
  } catch (error) {
    console.error("Failed to fetch public sports:", error);
    return NextResponse.json(
      { error: "Failed to fetch sports" },
      { status: 500 }
    );
  }
}
