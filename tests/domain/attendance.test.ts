import { describe, it, expect } from "vitest";
import {
  calculateAttendancePercentage,
  attendancePercent,
  meetsAttendanceThreshold,
} from "@/domain/attendance";

describe("Attendance Domain", () => {
  describe("attendancePercent", () => {
    it("returns 0 when total is 0 or negative", () => {
      expect(attendancePercent(0, 0)).toBe(0);
      expect(attendancePercent(2, 0)).toBe(0);
      expect(attendancePercent(2, -1)).toBe(0);
    });

    it("returns 100 when present equals total", () => {
      expect(attendancePercent(5, 5)).toBe(100);
    });

    it("calculates percentage accurately", () => {
      expect(attendancePercent(3, 4)).toBe(75);
      expect(attendancePercent(1, 2)).toBe(50);
      expect(attendancePercent(2, 3)).toBeCloseTo(66.667, 2);
    });
  });

  describe("calculateAttendancePercentage", () => {
    it("returns 0 when there are no closed sessions", () => {
      expect(calculateAttendancePercentage(0, 0)).toBe(0);
    });

    it("returns 100 when all sessions are present", () => {
      expect(calculateAttendancePercentage(4, 4)).toBe(100);
    });

    it("returns 50 when half sessions are present", () => {
      expect(calculateAttendancePercentage(2, 4)).toBe(50);
    });

    it("returns 75 for 3 out of 4", () => {
      expect(calculateAttendancePercentage(3, 4)).toBe(75);
    });

    it("handles fractional percentages without rounding", () => {
      // 2 out of 3 = 66.666...
      const result = calculateAttendancePercentage(2, 3);
      expect(result).toBeCloseTo(66.667, 2);
      expect(result).toBeLessThan(75);
    });
  });

  describe("meetsAttendanceThreshold", () => {
    it("returns false for 0 closed sessions", () => {
      expect(meetsAttendanceThreshold(0, 0)).toBe(false);
    });

    it("returns true for exactly 75%", () => {
      expect(meetsAttendanceThreshold(3, 4)).toBe(true);
    });

    it("returns false for 74.9%", () => {
      // 74 out of 99 = 74.74...%
      expect(meetsAttendanceThreshold(74, 99)).toBe(false);
    });

    it("returns true for 100%", () => {
      expect(meetsAttendanceThreshold(10, 10)).toBe(true);
    });

    it("returns false for just under 75%", () => {
      // 749 out of 1000 = 74.9%
      expect(meetsAttendanceThreshold(749, 1000)).toBe(false);
    });

    it("returns true for just at 75%", () => {
      // 750 out of 1000 = 75.0%
      expect(meetsAttendanceThreshold(750, 1000)).toBe(true);
    });
  });
});
