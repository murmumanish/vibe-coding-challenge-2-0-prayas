// src/lib/validators.ts
import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Sports ──────────────────────────────────────────────────────────
export const createSportSchema = z.object({
  name: z.string().min(1, "Sport name is required").max(100),
});

// ─── Players ─────────────────────────────────────────────────────────
export const createPlayerSchema = z
  .object({
    name: z.string().min(1, "Player name is required").max(100),
    age: z
      .number()
      .int()
      .min(5, "Age must be at least 5")
      .max(60, "Age must be at most 60"),
    sportId: z.string().min(1, "Sport is required"),
    phone: z.string().max(20).optional().or(z.literal("")),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.email && !data.password) {
        return false;
      }
      return true;
    },
    {
      message: "Password is required when creating a login account",
      path: ["password"],
    }
  );

// ─── Sessions ────────────────────────────────────────────────────────
export const createSessionSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  sportId: z.string().min(1, "Sport is required"),
});

// ─── Attendance ──────────────────────────────────────────────────────
export const markAttendanceSchema = z.object({
  sessionId: z.string().optional(),
  playerId: z.string().min(1, "Player is required"),
  status: z.enum(["present", "absent"]),
});

export const updateAttendanceSchema = z.object({
  playerId: z.string().min(1, "Player is required"),
  status: z.enum(["present", "absent"]),
});

export const batchAttendanceSchema = z.object({
  attendances: z.array(
    z.object({
      playerId: z.string().min(1, "Player is required"),
      status: z.enum(["present", "absent"]),
    })
  ).min(1, "At least one attendance record is required"),
});

// ─── Matches ─────────────────────────────────────────────────────────
export const createMatchSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  sportId: z.string().min(1, "Sport is required"),
  opponent: z.string().min(1, "Opponent name is required").max(200),
  location: z.string().max(200).optional(),
});

// ─── Match Scores ────────────────────────────────────────────────────
export const createMatchScoreSchema = z.preprocess(
  (input: unknown) => {
    if (typeof input === "object" && input !== null) {
      const raw = input as Record<string, unknown>;
      const playerId = raw.playerId ?? raw.player ?? raw.id;
      const primaryScore =
        raw.primaryScore !== undefined
          ? raw.primaryScore
          : raw.score !== undefined
          ? raw.score
          : undefined;
      return {
        ...raw,
        playerId,
        primaryScore,
      };
    }
    return input;
  },
  z.object({
    matchId: z.string().optional(),
    playerId: z.string({
      error: "Player ID is required",
    }).min(1, "Player is required"),
    player: z.string().optional(),
    primaryScore: z.coerce.number({
      error: "Score is required",
    }).min(0, "Score cannot be negative"),
    score: z.coerce.number().optional(),
    stats: z.record(z.string(), z.unknown()).optional(),
  })
);
