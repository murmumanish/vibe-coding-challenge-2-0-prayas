// src/domain/matchEligibility.ts

export interface AttendanceRecord {
  dateKey: string;
  sportId: string;
  status: "present" | "absent";
}

/**
 * Pure function to check if a player can be scored in a match.
 * Rules:
 * - Attendance in practice must be "present"
 * - Practice session dateKey must match match dateKey
 * - Practice session sport must match match sport
 */
export function canScoreMatch(
  attendanceStatus: string,
  sessionDateKey: string,
  sessionSport: string,
  matchDateKey: string,
  matchSport: string
): boolean {
  return (
    attendanceStatus === "present" &&
    sessionDateKey === matchDateKey &&
    sessionSport === matchSport
  );
}

/**
 * Determines whether a player is eligible for a match score given attendance records.
 */
export function isEligibleForMatch(
  attendanceRecords: AttendanceRecord[],
  matchDateKey: string,
  matchSportId: string
): boolean {
  return attendanceRecords.some((record) =>
    canScoreMatch(
      record.status,
      record.dateKey,
      record.sportId,
      matchDateKey,
      matchSportId
    )
  );
}
