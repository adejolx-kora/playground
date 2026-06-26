import { describe, expect, it } from "vitest";

import { getNumericValidity } from "./numeric-input.validation";

describe("numeric-input validation", () => {
  it("reports required empty values as missing", () => {
    expect(
      getNumericValidity({
        value: "",
        required: true,
        min: 0,
        max: 100,
        step: 1,
        scale: 0,
      }),
    ).toMatchObject({
      valueMissing: true,
      valid: false,
    });
  });

  it("treats incomplete drafts as bad input", () => {
    expect(
      getNumericValidity({
        value: "-",
        required: false,
        min: 0,
        max: 100,
        step: 1,
        scale: 0,
      }),
    ).toMatchObject({
      badInput: true,
      valid: false,
    });
  });

  it("evaluates step alignment from min, not from zero", () => {
    expect(
      getNumericValidity({
        value: "15",
        required: false,
        min: 10,
        max: 100,
        step: 5,
        scale: 0,
      }),
    ).toMatchObject({
      valid: true,
      stepMismatch: false,
    });
  });

  it("surfaces both overflow and step mismatch when both apply", () => {
    expect(
      getNumericValidity({
        value: "103",
        required: false,
        min: 0,
        max: 100,
        step: 5,
        scale: 0,
      }),
    ).toMatchObject({
      rangeOverflow: true,
      stepMismatch: true,
      valid: false,
    });
  });

  it("supports high-precision decimal constraints without floating-point drift", () => {
    expect(
      getNumericValidity({
        value: "123.456",
        required: false,
        min: 0,
        max: 1000,
        step: 0.001,
        scale: 3,
      }),
    ).toMatchObject({
      valid: true,
    });
  });
});
