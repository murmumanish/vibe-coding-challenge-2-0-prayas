// src/lib/scoreParams.ts
import { SPORT_PRESETS } from "@/domain/sportPresets";

export interface FormattedScoreParam {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
}

/**
 * Returns all match score parameters represented equally.
 * Evaluates sport-configured fields (from Sport document or domain preset)
 * and includes all recorded non-empty stats with uniform priority.
 */
export function formatEqualScoreParams(
  score: {
    primaryScore?: number;
    stats?: Record<string, unknown>;
    match?: {
      sport?: {
        name?: string;
        slug?: string;
        scoreFields?: Array<{
          key: string;
          label: string;
          isPrimary?: boolean;
          isActive?: boolean;
          unit?: string;
        }>;
      };
    };
  } | null | undefined,
  fallbackSportName = "Sport"
): FormattedScoreParam[] {
  if (!score) return [];

  const sportObj = score.match?.sport;
  const sportName = sportObj?.name || fallbackSportName;
  const sportSlug = sportObj?.slug || "";

  const sportPreset = SPORT_PRESETS.find(
    (p) =>
      p.slug.toLowerCase() === sportSlug.toLowerCase() ||
      p.name.toLowerCase() === sportName.toLowerCase()
  );

  const fields =
    sportObj?.scoreFields && sportObj.scoreFields.length > 0
      ? sportObj.scoreFields
      : sportPreset?.scoreFields || [];

  const primaryField =
    fields.find((f) => f.isPrimary) ||
    fields[0] || { key: "score", label: "Score" };

  const params: FormattedScoreParam[] = [];
  const seenKeys = new Set<string>();

  // 1. Configured fields
  for (const f of fields) {
    if (f.isActive === false) continue;
    seenKeys.add(f.key);

    let val: unknown = undefined;
    if (f.isPrimary || f.key === primaryField.key) {
      val = score.primaryScore;
    } else if (score.stats && typeof score.stats === "object") {
      val = score.stats[f.key];
    }

    if (val === undefined || val === null || val === "") {
      val = 0;
    }

    params.push({
      key: f.key,
      label: f.label,
      value: val as string | number,
      unit: f.unit,
    });
  }

  // 2. Extra recorded stats if any (excluding internal keys and notes)
  if (score.stats && typeof score.stats === "object") {
    for (const [k, v] of Object.entries(score.stats)) {
      if (
        k === "notes" ||
        k === "primaryScore" ||
        k === "score" ||
        k.toLowerCase() === "score" ||
        k === "_id" ||
        seenKeys.has(k)
      ) {
        continue;
      }
      if (typeof v === "number" || typeof v === "string") {
        const prettyLabel = k
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim();
        params.push({
          key: k,
          label: prettyLabel,
          value: v,
        });
      }
    }
  }

  // Fallback if no params configured
  if (params.length === 0) {
    params.push({
      key: primaryField.key || "score",
      label: primaryField.label || "Score",
      value: score.primaryScore ?? 0,
      unit: primaryField.unit,
    });
  }

  return params;
}
