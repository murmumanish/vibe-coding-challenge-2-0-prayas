import { describe, it, expect } from "vitest";
import {
  validateStats,
  validateStatsOrThrow,
  formatScoreSummary,
} from "@/domain/stats";
import { SPORT_PRESETS } from "@/domain/sportPresets";

const cricketPreset = SPORT_PRESETS.find((s) => s.slug === "cricket")!;
const swimmingPreset = SPORT_PRESETS.find((s) => s.slug === "swimming")!;
const kabaddiPreset = SPORT_PRESETS.find((s) => s.slug === "kabaddi")!;
const footballPreset = SPORT_PRESETS.find((s) => s.slug === "football")!;

describe("validateStats Domain Logic", () => {
  describe("Cricket Preset (Integer metrics: Runs, Wickets, Catches)", () => {
    it("accepts valid integer performance data", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        runs: 45,
        wickets: 2,
        catches: 1,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.primaryScore).toBe(45);
      expect(result.validatedStats).toEqual({
        runs: 45,
        wickets: 2,
        catches: 1,
      });
    });

    it("accepts only the required primary field when optional fields are omitted", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        runs: 82,
      });

      expect(result.isValid).toBe(true);
      expect(result.primaryScore).toBe(82);
      expect(result.validatedStats).toEqual({ runs: 82 });
    });

    it("rejects decimal numbers for integer sports (e.g. 12.5 runs)", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        runs: 12.5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.runs).toBe("Runs must be a whole number");
      expect(result.primaryScore).toBeNull();
    });

    it("rejects decimal numbers on secondary integer fields (e.g. 1.5 wickets)", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        runs: 30,
        wickets: 1.5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.wickets).toBe("Wickets must be a whole number");
    });

    it("rejects negative scores below min (e.g. -5 runs)", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        runs: -5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.runs).toBe("Runs cannot be less than 0");
    });

    it("rejects missing primary score when runs is omitted", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        wickets: 3,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.runs).toBe("Runs is required");
    });

    it("rejects completely empty or null stats input", () => {
      const result = validateStats(cricketPreset.scoreFields, null);

      expect(result.isValid).toBe(false);
      expect(result.errors.runs).toBe("Runs is required");
    });

    it("accepts string numbers that parse to valid integers", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        runs: "50",
        wickets: "2",
      });

      expect(result.isValid).toBe(true);
      expect(result.primaryScore).toBe(50);
      expect(result.validatedStats).toEqual({ runs: 50, wickets: 2 });
    });

    it("rejects non-numeric strings, NaN, and Infinity", () => {
      expect(
        validateStats(cricketPreset.scoreFields, { runs: "not-a-number" }).isValid
      ).toBe(false);

      expect(
        validateStats(cricketPreset.scoreFields, { runs: NaN }).isValid
      ).toBe(false);

      expect(
        validateStats(cricketPreset.scoreFields, { runs: Infinity }).isValid
      ).toBe(false);
    });

    it("rejects unrecognized fields not in the sport schema", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        runs: 25,
        fouls: 3,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.fouls).toBe('Unrecognized field: "fouls"');
    });

    it("supports root primaryScore fallback alias", () => {
      const result = validateStats(cricketPreset.scoreFields, {
        primaryScore: 75,
        wickets: 1,
      });

      expect(result.isValid).toBe(true);
      expect(result.primaryScore).toBe(75);
      expect(result.validatedStats).toEqual({ runs: 75, wickets: 1 });
    });
  });

  describe("Swimming Preset (Decimal metric: timeSeconds)", () => {
    it("accepts decimal times (e.g. 31.42 seconds)", () => {
      const result = validateStats(swimmingPreset.scoreFields, {
        timeSeconds: 31.42,
      });

      expect(result.isValid).toBe(true);
      expect(result.primaryScore).toBe(31.42);
      expect(result.validatedStats).toEqual({ timeSeconds: 31.42 });
    });

    it("accepts integer times as valid decimals (e.g. 30 seconds)", () => {
      const result = validateStats(swimmingPreset.scoreFields, {
        timeSeconds: 30,
      });

      expect(result.isValid).toBe(true);
      expect(result.primaryScore).toBe(30);
    });

    it("rejects negative swimming time (e.g. -1.25 seconds)", () => {
      const result = validateStats(swimmingPreset.scoreFields, {
        timeSeconds: -1.25,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.timeSeconds).toBe("Time cannot be less than 0");
    });

    it("rejects missing time in swimming", () => {
      const result = validateStats(swimmingPreset.scoreFields, {});

      expect(result.isValid).toBe(false);
      expect(result.errors.timeSeconds).toBe("Time is required");
    });
  });

  describe("Kabaddi & Football Presets", () => {
    it("validates Kabaddi raid and tackle points", () => {
      const result = validateStats(kabaddiPreset.scoreFields, {
        raidPoints: 9,
        tacklePoints: 4,
      });

      expect(result.isValid).toBe(true);
      expect(result.primaryScore).toBe(9);
      expect(result.validatedStats).toEqual({ raidPoints: 9, tacklePoints: 4 });
    });

    it("validates Football goals and assists", () => {
      const result = validateStats(footballPreset.scoreFields, {
        goals: 2,
        assists: 1,
      });

      expect(result.isValid).toBe(true);
      expect(result.primaryScore).toBe(2);
      expect(result.validatedStats).toEqual({ goals: 2, assists: 1 });
    });
  });

  describe("validateStatsOrThrow", () => {
    it("returns primaryScore and validatedStats on success", () => {
      const { primaryScore, validatedStats } = validateStatsOrThrow(
        cricketPreset.scoreFields,
        { runs: 55 }
      );
      expect(primaryScore).toBe(55);
      expect(validatedStats).toEqual({ runs: 55 });
    });

    it("throws an Error with a readable message on invalid input", () => {
      expect(() =>
        validateStatsOrThrow(cricketPreset.scoreFields, { runs: 12.5 })
      ).toThrow("Runs must be a whole number");
    });
  });

  describe("formatScoreSummary", () => {
    it("formats primary metric and breakdown pills cleanly", () => {
      const formatted = formatScoreSummary(
        cricketPreset.scoreFields,
        { runs: 45, wickets: 2, catches: 1 },
        45
      );

      expect(formatted.headline).toBe("45 Runs");
      expect(formatted.details).toEqual([
        { key: "wickets", label: "Wickets", value: 2, unit: undefined },
        { key: "catches", label: "Catches", value: 1, unit: undefined },
      ]);
    });

    it("formats swimming with units", () => {
      const formatted = formatScoreSummary(
        swimmingPreset.scoreFields,
        { timeSeconds: 31.42 },
        31.42
      );

      expect(formatted.headline).toBe("31.42 s Time");
      expect(formatted.details).toEqual([]);
    });
  });
});
