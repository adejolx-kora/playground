import { describe, expect, it } from "vitest";

import {
  formatNormalizedToLocalizedDisplay,
  getDirectionFromLocale,
  getNumberLocaleParts,
  parseLocalizedDraftToNormalized,
} from "./numeric-input.locale";

describe("numeric-input locale", () => {
  it("normalizes locale-native digits, separators, and minus signs", () => {
    const localeParts = getNumberLocaleParts("ar-EG");

    expect(parseLocalizedDraftToNormalized("؜-١٬٢٣٤٫٥٦", localeParts)).toBe(
      "-1234.56",
    );
  });

  it("parses grouped European decimals into normalized ASCII drafts", () => {
    const localeParts = getNumberLocaleParts("de-DE");

    expect(parseLocalizedDraftToNormalized("1.234,56", localeParts)).toBe(
      "1234.56",
    );
  });

  it("keeps rtl inference aligned with rtl locales", () => {
    expect(getDirectionFromLocale("ar-SA")).toBe("rtl");
    expect(getDirectionFromLocale("en-US")).toBe("ltr");
  });

  it("formats safe values and preserves unsafe values verbatim", () => {
    expect(formatNormalizedToLocalizedDisplay("1234.25", "en-US", 2)).toBe(
      "1,234.25",
    );
    expect(
      formatNormalizedToLocalizedDisplay("9007199254740993.25", "en-US", 2),
    ).toBe("9007199254740993.25");
  });
});
