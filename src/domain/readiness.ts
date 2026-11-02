// src/domain/readiness.ts
import { meetsAttendanceThreshold } from "./attendance";

const MIN_MATCHES = 2;
const MIN_ATTENDANCE_PERCENT = 75;

export interface ReadinessInput {
  presentCount: number;
  closedSessionCount: number;
  matchCount: number;
}

/**
 * Determines if a player is "Ready" for trial selection.
 * Rules:
 * - Attendance >= 75% (calculated from closed sessions)
 * - At least 2 matches played
 *
 * Supports dual invocation:
 * 1. isReady(attendancePercent: number, matchesPlayed: number): boolean
 * 2. isReady(input: ReadinessInput): boolean
 */
export function isReady(
  attendancePercent: number,
  matchesPlayed: number
): boolean;
export function isReady(input: ReadinessInput): boolean;
export function isReady(
  inputOrPercent: number | ReadinessInput,
  matchesPlayed?: number
): boolean {
  if (typeof inputOrPercent === "number") {
    const percent = inputOrPercent;
    const matches = matchesPlayed ?? 0;
    return percent >= MIN_ATTENDANCE_PERCENT && matches >= MIN_MATCHES;
  }

  const attendanceOk = meetsAttendanceThreshold(
    inputOrPercent.presentCount,
    inputOrPercent.closedSessionCount
  );
  const matchesOk = inputOrPercent.matchCount >= MIN_MATCHES;
  return attendanceOk && matchesOk;
}
