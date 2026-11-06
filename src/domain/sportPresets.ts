// src/domain/sportPresets.ts

// Predefined sports. When the coach picks one, sport.service COPIES it into the
// sports collection, so later edits here never change existing sports.

export type ScoreFieldPreset = {
  key: string;
  label: string;
  type: "number";
  min: number;
  integer: boolean;
  unit?: string;
  required: boolean;
  isPrimary: boolean;
  isActive: boolean;
};

export type SportPreset = {
  name: string;
  slug: string;
  scoreFields: ScoreFieldPreset[];
};

type FieldOptions = {
  primary?: boolean;
  required?: boolean;
  integer?: boolean;
  unit?: string;
};

// Small helper so each preset stays readable. Primary fields are always required.
function num(
  key: string,
  label: string,
  opts: FieldOptions = {}
): ScoreFieldPreset {
  return {
    key,
    label,
    type: "number",
    min: 0,
    integer: opts.integer ?? true,
    unit: opts.unit,
    required: opts.primary ? true : opts.required ?? false,
    isPrimary: opts.primary ?? false,
    isActive: true,
  };
}

export const SPORT_PRESETS: SportPreset[] = [
  {
    name: "Cricket",
    slug: "cricket",
    scoreFields: [
      num("runs", "Runs", { primary: true }),
      num("wickets", "Wickets"),
      num("catches", "Catches"),
    ],
  },
  {
    name: "Badminton",
    slug: "badminton",
    scoreFields: [
      num("pointsWon", "Points won", { primary: true }),
      num("gamesWon", "Games won"),
    ],
  },
  {
    name: "Kabaddi",
    slug: "kabaddi",
    scoreFields: [
      num("raidPoints", "Raid points", { primary: true }),
      num("tacklePoints", "Tackle points"),
    ],
  },
  {
    name: "Basketball",
    slug: "basketball",
    scoreFields: [
      num("points", "Points", { primary: true }),
      num("rebounds", "Rebounds"),
      num("assists", "Assists"),
    ],
  },
  {
    name: "Volleyball",
    slug: "volleyball",
    scoreFields: [
      num("points", "Points", { primary: true }),
      num("aces", "Aces"),
      num("blocks", "Blocks"),
    ],
  },
  {
    name: "Football",
    slug: "football",
    scoreFields: [
      num("goals", "Goals", { primary: true }),
      num("assists", "Assists"),
    ],
  },
  {
    name: "Hockey",
    slug: "hockey",
    scoreFields: [
      num("goals", "Goals", { primary: true }),
      num("assists", "Assists"),
    ],
  },
  {
    name: "Tennis",
    slug: "tennis",
    scoreFields: [
      num("gamesWon", "Games won", { primary: true }),
      num("setsWon", "Sets won"),
    ],
  },
  {
    name: "Martial Arts",
    slug: "martial-arts",
    scoreFields: [
      num("pointsScored", "Points scored", { primary: true }),
      num("boutsWon", "Bouts won"),
    ],
  },
  {
    name: "Swimming",
    slug: "swimming",
    scoreFields: [
      // Time is a decimal, so integer is false. Lower is better.
      num("timeSeconds", "Time", { primary: true, integer: false, unit: "s" }),
    ],
  },
];
