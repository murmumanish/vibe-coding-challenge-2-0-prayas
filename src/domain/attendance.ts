// src/domain/attendance.ts

/**
 * Calculates attendance percentage from closed sessions only.
 * Returns 0 if there are no closed sessions (avoids divide-by-zero).
 * Never rounds up — uses Math.floor-safe comparison externally.
 */
export function calculateAttendancePercentage(
  presentCount: number,
  closedSessionCount: number
): number {
  if (closedSessionCount <= 0) return 0;
  return (presentCount / closedSessionCount) * 100;
}

/**
 * Pure function to calculate attendance percentage given present and total count.
 * Returns 0 if total is <= 0 to avoid divide-by-zero.
 */
export function attendancePercent(present: number, total: number): number {
  if (total <= 0) return 0;
  return (present / total) * 100;
}

/**
 * Checks if attendance meets the 75% threshold.
 * 74.9% → false, 75.0% → true.
 */
export function meetsAttendanceThreshold(
  presentCount: number,
  closedSessionCount: number
): boolean {
  const percentage = calculateAttendancePercentage(
    presentCount,
    closedSessionCount
  );
  return percentage >= 75;
}
