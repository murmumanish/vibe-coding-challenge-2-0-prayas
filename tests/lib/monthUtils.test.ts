import { describe, it, expect } from "vitest";
import {
  getCurrentISTMonth,
  isValidMonthFormat,
  isFutureMonth,
  formatMonthTitle,
  formatMonthName,
  getPrevMonth,
  getNextMonth,
} from "@/lib/monthUtils";

describe("monthUtils", () => {
  describe("isValidMonthFormat", () => {
    it("accepts valid YYYY-MM strings", () => {
      expect(isValidMonthFormat("2026-01")).toBe(true);
      expect(isValidMonthFormat("2026-10")).toBe(true);
      expect(isValidMonthFormat("2026-12")).toBe(true);
      expect(isValidMonthFormat("1999-05")).toBe(true);
    });

    it("rejects invalid month strings", () => {
      expect(isValidMonthFormat("2026-00")).toBe(false);
      expect(isValidMonthFormat("2026-13")).toBe(false);
      expect(isValidMonthFormat("2026-1")).toBe(false);
      expect(isValidMonthFormat("26-10")).toBe(false);
      expect(isValidMonthFormat("2026/10")).toBe(false);
      expect(isValidMonthFormat("invalid")).toBe(false);
      expect(isValidMonthFormat("")).toBe(false);
    });
  });

  describe("isFutureMonth", () => {
    it("returns true for a month later than reference month", () => {
      expect(isFutureMonth("2026-12", "2026-10")).toBe(true);
      expect(isFutureMonth("2027-01", "2026-10")).toBe(true);
    });

    it("returns false for current or past months", () => {
      expect(isFutureMonth("2026-10", "2026-10")).toBe(false);
      expect(isFutureMonth("2026-09", "2026-10")).toBe(false);
      expect(isFutureMonth("2025-12", "2026-10")).toBe(false);
    });

    it("defaults reference to current IST month", () => {
      const current = getCurrentISTMonth();
      expect(isFutureMonth("2099-01")).toBe(true);
      expect(isFutureMonth("2000-01")).toBe(false);
      expect(isFutureMonth(current)).toBe(false);
    });
  });

  describe("formatMonthTitle and formatMonthName", () => {
    it("formats YYYY-MM to Full Month and Year", () => {
      expect(formatMonthTitle("2026-10")).toBe("October 2026");
      expect(formatMonthTitle("2025-01")).toBe("January 2025");
      expect(formatMonthTitle("2026-12")).toBe("December 2026");
    });

    it("formats YYYY-MM to Month name only", () => {
      expect(formatMonthName("2026-10")).toBe("October");
      expect(formatMonthName("2026-09")).toBe("September");
      expect(formatMonthName("2025-01")).toBe("January");
    });
  });

  describe("getPrevMonth and getNextMonth", () => {
    it("calculates previous month with year wrap", () => {
      expect(getPrevMonth("2026-10")).toBe("2026-09");
      expect(getPrevMonth("2026-01")).toBe("2025-12");
      expect(getPrevMonth("2025-12")).toBe("2025-11");
    });

    it("calculates next month with year wrap", () => {
      expect(getNextMonth("2026-09")).toBe("2026-10");
      expect(getNextMonth("2026-12")).toBe("2027-01");
      expect(getNextMonth("2025-11")).toBe("2025-12");
    });
  });
});
