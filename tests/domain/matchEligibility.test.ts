import { describe, it, expect } from "vitest";
import {
  isEligibleForMatch,
  canScoreMatch,
  AttendanceRecord,
} from "@/domain/matchEligibility";

describe("Match Eligibility Domain", () => {
  const sportA = "sport-a-id";
  const sportB = "sport-b-id";

  describe("canScoreMatch", () => {
    it("returns true when player is present and session matches match date and sport", () => {
      expect(canScoreMatch("present", "2026-11-02", sportA, "2026-11-02", sportA)).toBe(true);
    });

    it("returns false when player is absent", () => {
      expect(canScoreMatch("absent", "2026-11-02", sportA, "2026-11-02", sportA)).toBe(false);
    });

    it("returns false when date keys do not match", () => {
      expect(canScoreMatch("present", "2026-11-01", sportA, "2026-11-02", sportA)).toBe(false);
    });

    it("returns false when sports do not match", () => {
      expect(canScoreMatch("present", "2026-11-02", sportA, "2026-11-02", sportB)).toBe(false);
    });
  });

  describe("isEligibleForMatch", () => {
    it("returns true when player is present on same date and same sport", () => {
      const records: AttendanceRecord[] = [
        { dateKey: "2026-11-01", sportId: sportA, status: "present" },
      ];
      expect(isEligibleForMatch(records, "2026-11-01", sportA)).toBe(true);
    });

    it("returns false when player is absent on the match day", () => {
      const records: AttendanceRecord[] = [
        { dateKey: "2026-11-01", sportId: sportA, status: "absent" },
      ];
      expect(isEligibleForMatch(records, "2026-11-01", sportA)).toBe(false);
    });

    it("returns false when no session exists for that day", () => {
      const records: AttendanceRecord[] = [
        { dateKey: "2026-10-31", sportId: sportA, status: "present" },
      ];
      expect(isEligibleForMatch(records, "2026-11-01", sportA)).toBe(false);
    });

    it("returns false when present on same date but different sport", () => {
      const records: AttendanceRecord[] = [
        { dateKey: "2026-11-01", sportId: sportB, status: "present" },
      ];
      expect(isEligibleForMatch(records, "2026-11-01", sportA)).toBe(false);
    });

    it("returns false for empty attendance records", () => {
      expect(isEligibleForMatch([], "2026-11-01", sportA)).toBe(false);
    });

    it("returns true when one of multiple records matches", () => {
      const records: AttendanceRecord[] = [
        { dateKey: "2026-10-30", sportId: sportA, status: "present" },
        { dateKey: "2026-11-01", sportId: sportB, status: "present" },
        { dateKey: "2026-11-01", sportId: sportA, status: "present" },
      ];
      expect(isEligibleForMatch(records, "2026-11-01", sportA)).toBe(true);
    });
  });
});
