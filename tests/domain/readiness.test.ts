import { describe, it, expect } from "vitest";
import { isReady } from "@/domain/readiness";

describe("Readiness Domain", () => {
  describe("isReady with percent and match count (Day 3)", () => {
    it("returns true for 75% attendance and 2 matches", () => {
      expect(isReady(75, 2)).toBe(true);
    });

    it("returns false for 74% attendance and 2 matches", () => {
      expect(isReady(74, 2)).toBe(false);
    });

    it("returns false for 74.9% attendance and 2 matches", () => {
      expect(isReady(74.9, 2)).toBe(false);
    });

    it("returns false for 75% attendance and 1 match", () => {
      expect(isReady(75, 1)).toBe(false);
    });

    it("returns true for 80% attendance and 3 matches", () => {
      expect(isReady(80, 3)).toBe(true);
    });
  });

  describe("isReady with ReadinessInput object", () => {
    it("returns true for 75% attendance and 2 matches", () => {
      expect(
        isReady({ presentCount: 3, closedSessionCount: 4, matchCount: 2 })
      ).toBe(true);
    });

    it("returns false for 75% attendance and 1 match", () => {
      expect(
        isReady({ presentCount: 3, closedSessionCount: 4, matchCount: 1 })
      ).toBe(false);
    });

    it("returns false for 100% attendance and 0 matches", () => {
      expect(
        isReady({ presentCount: 10, closedSessionCount: 10, matchCount: 0 })
      ).toBe(false);
    });

    it("returns false for 74.9% attendance with 2 matches", () => {
      // 749/1000 = 74.9%
      expect(
        isReady({ presentCount: 749, closedSessionCount: 1000, matchCount: 2 })
      ).toBe(false);
    });

    it("returns false for zero closed sessions", () => {
      expect(
        isReady({ presentCount: 0, closedSessionCount: 0, matchCount: 5 })
      ).toBe(false);
    });

    it("returns true for exactly 75% and exactly 2 matches", () => {
      expect(
        isReady({ presentCount: 75, closedSessionCount: 100, matchCount: 2 })
      ).toBe(true);
    });

    it("returns true for > 75% and > 2 matches", () => {
      expect(
        isReady({ presentCount: 90, closedSessionCount: 100, matchCount: 5 })
      ).toBe(true);
    });

    it("returns false when only open sessions exist (closedSessionCount = 0)", () => {
      expect(
        isReady({ presentCount: 0, closedSessionCount: 0, matchCount: 3 })
      ).toBe(false);
    });
  });
});
