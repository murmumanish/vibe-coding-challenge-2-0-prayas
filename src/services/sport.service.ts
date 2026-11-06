// src/services/sport.service.ts
import { dbConnect } from "@/lib/db";
import Sport, { ISport, ScoreField, isValidScoreFields } from "@/models/Sport";
import { SPORT_PRESETS, SportPreset, ScoreFieldPreset } from "@/domain/sportPresets";
import { slugify } from "@/lib/utils";
import { AppError } from "@/lib/errors";

export interface CreateScoreFieldInput {
  key?: string;
  label: string;
  type?: "number";
  min?: number;
  integer?: boolean;
  unit?: string;
  required?: boolean;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface CreateSportInput {
  name?: string;
  presetSlug?: string;
  scoreFields?: CreateScoreFieldInput[];
}

export async function getAllSports(activeOnly: boolean = false) {
  await dbConnect();
  const filter = activeOnly ? { isActive: true } : {};
  const sports = await Sport.find(filter).sort({ name: 1 }).lean();

  return sports.map((sport) => {
    if (!sport.scoreFields || sport.scoreFields.length === 0) {
      const preset = SPORT_PRESETS.find(
        (p) =>
          p.slug === sport.slug ||
          p.name.toLowerCase() === (sport.name || "").toLowerCase()
      );
      if (preset) {
        return {
          ...sport,
          scoreFields: preset.scoreFields,
          isPreset: true,
        };
      }
    }
    return sport;
  });
}

/**
 * Returns the list of standard predefined sports with an indicator of
 * whether they have already been added to the academy database.
 */
export async function getSportPresets() {
  await dbConnect();
  const existingSports = await Sport.find({}).select("slug isActive").lean();
  const installedMap = new Map<string, boolean>();
  for (const s of existingSports) {
    installedMap.set(s.slug, s.isActive);
  }

  return SPORT_PRESETS.map((preset) => ({
    ...preset,
    isInstalled: installedMap.has(preset.slug),
    isActive: installedMap.get(preset.slug) ?? false,
  }));
}

/**
 * Creates a sport either from a preset copy or with custom coach scoring fields.
 */
export async function createSport(
  nameOrInput: string | CreateSportInput
): Promise<ISport> {
  await dbConnect();

  let name: string;
  let slug: string;
  let isPreset = false;
  let scoreFields: ScoreFieldPreset[] | ScoreField[] | undefined = undefined;

  if (typeof nameOrInput === "string") {
    name = nameOrInput.trim();
    slug = slugify(name);
  } else if (nameOrInput.presetSlug) {
    // 1. Copying from Preset
    const preset = SPORT_PRESETS.find((p) => p.slug === nameOrInput.presetSlug);
    if (!preset) {
      throw new AppError("Sport preset not found", 404);
    }
    name = preset.name;
    slug = preset.slug;
    isPreset = true;
    scoreFields = preset.scoreFields;
  } else {
    // 2. Custom sport creation with custom fields
    if (!nameOrInput.name || !nameOrInput.name.trim()) {
      throw new AppError("Sport name is required", 400);
    }
    name = nameOrInput.name.trim();
    slug = slugify(name);

    if (nameOrInput.scoreFields && nameOrInput.scoreFields.length > 0) {
      // Validate and clean custom score fields
      const cleanedFields: ScoreField[] = nameOrInput.scoreFields.map((f, idx) => {
        let key = f.key ? slugify(f.key).replace(/-/g, "_") : "";
        if (!key) {
          // Derive safe key from label
          const raw = f.label
            .trim()
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(/\s+/)
            .map((word, i) =>
              i === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join("");
          key = raw || `field_${idx + 1}`;
        }

        return {
          key,
          label: f.label.trim(),
          type: "number",
          min: typeof f.min === "number" ? f.min : 0,
          integer: f.integer !== false,
          unit: f.unit?.trim() || undefined,
          required: f.isPrimary ? true : Boolean(f.required),
          isPrimary: Boolean(f.isPrimary),
          isActive: f.isActive !== false,
        };
      });

      if (!isValidScoreFields(cleanedFields)) {
        throw new AppError(
          "Invalid scoring fields: must have unique keys and exactly one active, required primary field",
          400
        );
      }
      scoreFields = cleanedFields;
    }
  }

  if (!slug) {
    throw new AppError("Invalid sport name", 400);
  }

  const existing = await Sport.findOne({ slug });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.name = name;
      if (scoreFields) {
        existing.scoreFields = scoreFields as any;
      }
      await existing.save();
      return existing;
    }
    throw new AppError("A sport with this name already exists", 409);
  }

  return Sport.create({
    name,
    slug,
    isPreset,
    isActive: true,
    ...(scoreFields ? { scoreFields } : {}),
  });
}

/**
 * Appends a new scoring metric to an existing sport.
 */
export async function addScoreFieldToSport(
  id: string,
  field: CreateScoreFieldInput
): Promise<ISport> {
  await dbConnect();
  const sport = await Sport.findById(id);
  if (!sport) {
    throw new AppError("Sport not found", 404);
  }

  // If sport had no scoreFields, populate from preset first
  if (!sport.scoreFields || sport.scoreFields.length === 0) {
    const preset = SPORT_PRESETS.find(
      (p) =>
        p.slug === sport.slug ||
        p.name.toLowerCase() === (sport.name || "").toLowerCase()
    );
    if (preset) {
      sport.scoreFields = [...preset.scoreFields];
      sport.isPreset = true;
    }
  }

  const rawKey = field.key
    ? slugify(field.key).replace(/-/g, "_")
    : field.label
        .trim()
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(/\s+/)
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join("");

  const key = rawKey || `field_${(sport.scoreFields?.length || 0) + 1}`;

  const exists = sport.scoreFields?.some((f) => f.key === key);
  if (exists) {
    throw new AppError(`A scoring field with key "${key}" already exists`, 409);
  }

  const newField: ScoreField = {
    key,
    label: field.label.trim(),
    type: "number",
    min: typeof field.min === "number" ? field.min : 0,
    integer: field.integer !== false,
    unit: field.unit?.trim() || undefined,
    required: false,
    isPrimary: false,
    isActive: true,
  };

  if (!sport.scoreFields) {
    sport.scoreFields = [];
  }
  sport.scoreFields.push(newField);
  await sport.save();
  return sport;
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
