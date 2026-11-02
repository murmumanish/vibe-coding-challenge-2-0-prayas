// src/services/sport.service.ts
import { dbConnect } from "@/lib/db";
import Sport, { ISport } from "@/models/Sport";
import { slugify } from "@/lib/utils";
import { AppError } from "@/lib/errors";

export async function getAllSports(activeOnly: boolean = false) {
  await dbConnect();
  const filter = activeOnly ? { isActive: true } : {};
  return Sport.find(filter).sort({ name: 1 }).lean();
}

export async function createSport(name: string): Promise<ISport> {
  await dbConnect();
  const trimmedName = name.trim();
  const slug = slugify(trimmedName);

  if (!slug) {
    throw new AppError("Invalid sport name", 400);
  }

  const existing = await Sport.findOne({ slug });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.name = trimmedName;
      await existing.save();
      return existing;
    }
    throw new AppError("A sport with this name already exists", 409);
  }

  return Sport.create({
    name: trimmedName,
    slug,
    isActive: true,
  });
}

export async function toggleSportStatus(id: string): Promise<ISport> {
  await dbConnect();
  const sport = await Sport.findById(id);
  if (!sport) {
    throw new AppError("Sport not found", 404);
  }

  sport.isActive = !sport.isActive;
  await sport.save();
  return sport;
}

export async function archiveSport(id: string): Promise<ISport> {
  await dbConnect();
  const sport = await Sport.findById(id);
  if (!sport) {
    throw new AppError("Sport not found", 404);
  }

  sport.isActive = false;
  await sport.save();
  return sport;
}
