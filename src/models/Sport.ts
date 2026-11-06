// src/models/Sport.ts
import { Schema, model, models, type Model } from "mongoose";
import { SPORT_PRESETS } from "@/domain/sportPresets";

export type ScoreField = {
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

// One scoring field of a sport, e.g. "Runs" for cricket.
// Values for these fields are stored on matchscores as stats: { [key]: number }.
const scoreFieldSchema = new Schema(
  {
    key: {
      $type: String,
      required: true,
      trim: true,
      match: /^[a-zA-Z][a-zA-Z0-9_]*$/, // safe as a MongoDB object key
    },
    label: { $type: String, required: true, trim: true, maxlength: 40 },
    type: { $type: String, enum: ["number"], default: "number" }, // v1: numbers only
    min: { $type: Number, default: 0 },
    integer: { $type: Boolean, default: true }, // false for decimals, e.g. swim time
    unit: { $type: String, trim: true, maxlength: 10 }, // e.g. "s"
    required: { $type: Boolean, default: false },
    isPrimary: { $type: Boolean, default: false }, // headline number shown in lists
    isActive: { $type: Boolean, default: true }, // false = archived, never deleted
  },
  { _id: false, typeKey: "$type" }
);

// Rules for the whole list: unique keys, exactly one active primary field,
// and that primary field must be required.
export function isValidScoreFields(fields: ScoreField[]): boolean {
  if (!fields || fields.length === 0) return false;

  const keys = new Set(fields.map((f) => f.key));
  if (keys.size !== fields.length) return false;

  const activePrimary = fields.filter((f) => f.isPrimary && f.isActive !== false);
  return activePrimary.length === 1 && activePrimary[0].required === true;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface ISportDoc {
  name: string;
  slug: string;
  isPreset: boolean;
  isActive: boolean;
  scoreFields: ScoreField[];
  createdAt: Date;
  updatedAt: Date;
}

const sportSchema = new Schema<ISportDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    isPreset: { type: Boolean, default: false }, // copied from SPORT_PRESETS
    isActive: { type: Boolean, default: true }, // false = archived sport
    scoreFields: {
      type: [scoreFieldSchema],
      validate: {
        validator: isValidScoreFields,
        message:
          "Sport needs unique field keys and exactly one active, required primary field",
      },
    },
  },
  { timestamps: true }
);

sportSchema.index({ slug: 1 }, { unique: true });

sportSchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  // If scoreFields are not supplied, check if there's a matching preset or supply default
  if (!this.scoreFields || this.scoreFields.length === 0) {
    const preset = SPORT_PRESETS.find(
      (p) =>
        p.slug === this.slug ||
        p.name.toLowerCase() === (this.name || "").toLowerCase()
    );
    if (preset) {
      this.scoreFields = preset.scoreFields as any;
      this.isPreset = true;
    } else {
      this.scoreFields = [
        {
          key: "score",
          label: "Score",
          type: "number",
          min: 0,
          integer: true,
          unit: "pts",
          required: true,
          isPrimary: true,
          isActive: true,
        },
      ];
    }
  }
});

export type SportDoc = ISportDoc;
export type ISport = ISportDoc & { _id: any };

// `models.Sport ||` avoids "model already compiled" errors during Next.js hot reload.
export const Sport =
  (models.Sport as Model<ISportDoc>) || model<ISportDoc>("Sport", sportSchema);

export default Sport;
