import { describe, expect, it } from "vitest";

import {
  formatScaledUnitsToNormalized,
  getCanStep,
  getFractionDigits,
  parseNormalizedDraftToScaledUnits,
  stepNormalizedDraft,
} from "./numeric-input.math";

describe("numeric-input math", () => {
  it("parses exponent-based numeric props without corrupting their value", () => {
    expect(getFractionDigits(1e-7)).toBe(7);
    expect(parseNormalizedDraftToScaledUnits(1e-7, 7)).toBe(1n);
    expect(stepNormalizedDraft("0", 1, 0, 1, 1e-7, 7)).toBe("0.0000001");
  });

  it("treats scientific-notation strings as invalid drafts instead of misreading them", () => {
    expect(parseNormalizedDraftToScaledUnits("1e-7", 7)).toBeNull();
    expect(getCanStep("1e-7", 1, 0, 1, 7)).toBe(true);
  });

  it("preserves configured precision when formatting stepped values", () => {
    expect(stepNormalizedDraft("0.20", 1, 0, 1, 0.05, 2)).toBe("0.25");
    expect(formatScaledUnitsToNormalized(25n, 2)).toBe("0.25");
  });

  it("clamps at the numeric boundaries during stepping", () => {
    expect(stepNormalizedDraft("0.95", 1, 0, 1, 0.1, 2)).toBe("1.00");
    expect(stepNormalizedDraft("0.05", -1, 0, 1, 0.1, 2)).toBe("0.00");
  });
});
