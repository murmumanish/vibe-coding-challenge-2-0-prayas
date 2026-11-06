// src/domain/stats.ts
import { ScoreFieldPreset } from "./sportPresets";

export type ScoreFieldLike = {
  key: string;
  label: string;
  type?: string;
  min?: number;
  integer?: boolean;
  unit?: string;
  required?: boolean;
  isPrimary?: boolean;
  isActive?: boolean;
};

export interface ValidateStatsResult {
  isValid: boolean;
  errors: Record<string, string>;
  primaryScore: number | null;
  validatedStats: Record<string, number>;
}

/**
 * Validates a stats dictionary against a sport's scoring field configuration.
 *
 * Rules enforced:
 * - Active fields only.
 * - Primary field is mandatory and headlines the score.
 * - Required active fields must be present and non-empty.
 * - Minimum value boundaries (default min: 0).
 * - Integer constraints:
 *     - If integer === true (or omitted/default): decimals like 12.5 are REJECTED.
 *     - If integer === false (e.g. swimming timeSeconds): decimals like 31.42 are ACCEPTED.
 * - Non-numeric strings or NaN/Infinity are REJECTED.
 * - Unknown or inactive fields are REJECTED when a sport has configured scoreFields.
 */
export function validateStats(
  fields: ScoreFieldLike[] | undefined | null,
  rawStats: Record<string, unknown> | null | undefined
): ValidateStatsResult {
  const errors: Record<string, string> = {};
  const validatedStats: Record<string, number> = {};
  let primaryScore: number | null = null;

  const isDefaultFallback = !fields || fields.length === 0;

  // Fallback if sport has no configured fields
  const effectiveFields: ScoreFieldLike[] = !isDefaultFallback
    ? fields
    : [
        {
          key: "score",
          label: "Score",
          type: "number",
          min: 0,
          integer: true,
          required: true,
          isPrimary: true,
          isActive: true,
        },
      ];

  const activeFields = effectiveFields.filter((f) => f.isActive !== false);
  const primaryField = activeFields.find((f) => f.isPrimary);

  if (!primaryField) {
    return {
      isValid: false,
      errors: { _general: "Sport has no active primary score field configured" },
      primaryScore: null,
      validatedStats: {},
    };
  }

  const activeFieldsByKey = new Map<string, ScoreFieldLike>();
  for (const field of activeFields) {
    activeFieldsByKey.set(field.key, field);
  }

  const input = rawStats && typeof rawStats === "object" ? { ...rawStats } : {};

  // Support primaryScore passed at root if the sport primary key was omitted
  if (
    input[primaryField.key] === undefined &&
    input.primaryScore !== undefined
  ) {
    input[primaryField.key] = input.primaryScore;
  }

  // 1. Check for unknown / unexpected keys only when explicit fields are configured
  if (!isDefaultFallback) {
    for (const key of Object.keys(input)) {
      // Ignore internal or alias metadata keys
      if (key === "primaryScore" || key === "_id" || key === "notes") {
        continue;
      }
      if (!activeFieldsByKey.has(key)) {
        errors[key] = `Unrecognized field: "${key}"`;
      }
    }
  }

  // 2. Validate all active fields
  for (const field of activeFields) {
    const rawVal = input[field.key];
    const isMissing =
      rawVal === undefined ||
      rawVal === null ||
      (typeof rawVal === "string" && rawVal.trim() === "");

    if (isMissing) {
      if (field.required || field.isPrimary) {
        // If isDefaultFallback, check if any numeric value was passed as primaryScore
        if (isDefaultFallback && input.primaryScore !== undefined) {
          // Handled below
        } else {
          errors[field.key] = `${field.label} is required`;
        }
      }
      continue;
    }

    // Must be a valid numeric value
    const num =
      typeof rawVal === "number"
        ? rawVal
        : typeof rawVal === "string"
        ? Number(rawVal.trim())
        : NaN;

    if (isNaN(num) || !Number.isFinite(num)) {
      errors[field.key] = `${field.label} must be a valid number`;
      continue;
    }

    // Min boundary
    const minVal = field.min ?? 0;
    if (num < minVal) {
      errors[field.key] = `${field.label} cannot be less than ${minVal}`;
      continue;
    }

    // Integer enforcement (reject decimals if integer is true / default)
    const requiresInteger = field.integer !== false;
    if (requiresInteger && !Number.isInteger(num)) {
      errors[field.key] = `${field.label} must be a whole number`;
      continue;
    }

    // Success
    validatedStats[field.key] = num;

    if (field.isPrimary) {
      primaryScore = num;
    }
  }

  // If in fallback mode, ingest any other numeric fields passed into validatedStats
  if (isDefaultFallback) {
    for (const [key, val] of Object.entries(input)) {
      if (key === "_id" || key === "notes") continue;
      const num =
        typeof val === "number"
          ? val
          : typeof val === "string"
          ? Number(val.trim())
          : NaN;
      if (!isNaN(num) && Number.isFinite(num)) {
        validatedStats[key] = num;
        if (primaryScore === null) {
          primaryScore = num;
          delete errors[primaryField.key];
        }
      }
    }
  }

  // Ensure primary score was set and no error was flagged on it
  if (primaryScore === null && !errors[primaryField.key]) {
    errors[primaryField.key] = `${primaryField.label} is required`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    primaryScore,
    validatedStats,
  };
}

/**
 * Helper that validates and returns { primaryScore, validatedStats }
 * or throws an Error with the first encountered validation error.
 */
export function validateStatsOrThrow(
  fields: ScoreFieldLike[] | undefined | null,
  rawStats: Record<string, unknown> | null | undefined
): { primaryScore: number; validatedStats: Record<string, number> } {
  const result = validateStats(fields, rawStats);
  if (!result.isValid || result.primaryScore === null) {
    const firstKey = Object.keys(result.errors)[0];
    const msg = result.errors[firstKey] || "Invalid stats provided";
    throw new Error(msg);
  }
  return {
    primaryScore: result.primaryScore,
    validatedStats: result.validatedStats,
  };
}

/**
 * Formats stats into a clean string representation for badges / cards.
 * E.g., "45 Runs • 2 Wickets • 1 Catch"
 */
export function formatScoreSummary(
  fields: ScoreFieldLike[] | undefined | null,
  stats: Record<string, unknown> | null | undefined,
  primaryScore: number
): {
  headline: string;
  details: Array<{ key: string; label: string; value: number; unit?: string }>;
} {
  if (!fields || fields.length === 0) {
    return {
      headline: `${primaryScore}`,
      details: [],
    };
  }

  const primaryField = fields.find((f) => f.isPrimary && f.isActive !== false);
  const primaryUnit = primaryField?.unit ? ` ${primaryField.unit}` : "";
  const headline = `${primaryScore}${primaryUnit} ${primaryField?.label || ""}`.trim();

  const details: Array<{
    key: string;
    label: string;
    value: number;
    unit?: string;
  }> = [];

  if (stats && typeof stats === "object") {
    for (const field of fields) {
      if (field.isPrimary || field.isActive === false) continue;
      const val = stats[field.key];
      if (typeof val === "number") {
        details.push({
          key: field.key,
          label: field.label,
          value: val,
          unit: field.unit,
        });
      }
    }
  }

  return { headline, details };
}
