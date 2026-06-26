/** Math helpers for normalized drafts and scaled-unit arithmetic. */

import type { ScaledConstraintUnits } from "./numeric-input.types";

/** Expands scientific notation into a plain decimal string. */
function expandScientificNotation(input: string) {
  const match = input.match(/^([+-]?)(\d+)(?:\.(\d*))?[eE]([+-]?\d+)$/);

  if (!match) {
    return input;
  }

  const [, sign, integerPart, fractionalPart = "", exponentRaw] = match;
  const exponent = Number(exponentRaw);

  if (!Number.isInteger(exponent)) {
    return input;
  }

  const digits = `${integerPart}${fractionalPart}`;
  const decimalIndex = integerPart.length + exponent;

  if (decimalIndex <= 0) {
    return `${sign}0.${"0".repeat(Math.abs(decimalIndex))}${digits}`.replace(
      /^([+-]?)0+(?=\d)/,
      "$10",
    );
  }

  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  }

  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

/** Normalizes numeric props before they are parsed into scaled units. */
function normalizeNumberish(value: string | number) {
  if (typeof value === "number") {
    return expandScientificNotation(String(value));
  }

  return value.trim();
}

/** Clamps a scaled value into the inclusive `[min, max]` range. */
export function clampToRange(value: bigint, min: bigint, max: bigint) {
  return value < min ? min : value > max ? max : value;
}

/** Returns the number of fractional digits in a numeric value. */
export function getFractionDigits(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return 0;
  }

  const stringValue = normalizeNumberish(value);
  const dotIndex = stringValue.indexOf(".");

  if (dotIndex === -1) {
    return 0;
  }

  return stringValue.length - dotIndex - 1;
}

/** Returns the largest fractional precision across a group of values. */
export function getMaxFractionDigits(
  ...values: Array<string | number | undefined>
): number {
  return values.reduce<number>(
    (maxDigits: number, currentValue: string | number | undefined) =>
      Math.max(maxDigits, getFractionDigits(currentValue)),
    0,
  );
}

/**
 * Sanitizes a draft into normalized form.
 *
 * The normalized format uses ASCII digits, `"."` as the decimal separator,
 * and an optional leading `"-"`.
 */
export function sanitizeNumericDraft(value: string) {
  const trimmed = value.trim();

  if (/^[+-]?(?:\d+\.?\d*|\d*\.\d+)[eE][+-]?\d+$/.test(trimmed)) {
    return trimmed;
  }

  const filtered = value.replace(/[^\d.-]/g, "");
  if (!filtered) {
    return "";
  }

  const isNegative = filtered.startsWith("-");
  const unsigned = filtered.replace(/-/g, "");
  const firstDot = unsigned.indexOf(".");

  let normalizedUnsigned = unsigned;
  if (firstDot !== -1) {
    const integerPart = unsigned.slice(0, firstDot).replace(/\./g, "");
    const decimalPart = unsigned.slice(firstDot + 1).replace(/\./g, "");
    normalizedUnsigned = `${integerPart}.${decimalPart}`;
  }

  return `${isNegative ? "-" : ""}${normalizedUnsigned}`;
}

/** Returns `true` when a normalized draft is parseable as a numeric value. */
export function isParseableNumericDraft(draft: string) {
  if (!draft || draft === "-" || draft === "." || draft === "-.") {
    return false;
  }

  return /^-?\d*(\.\d*)?$/.test(draft);
}

/** Parses a normalized draft into scaled BigInt units, or `null` if invalid. */
export function parseNormalizedDraftToScaledUnits(
  value: string | number,
  scale: number,
) {
  const normalizedInput = normalizeNumberish(value);
  const sanitized =
    typeof value === "number"
      ? normalizedInput
      : sanitizeNumericDraft(normalizedInput);

  if (!isParseableNumericDraft(sanitized)) {
    return null;
  }

  const isNegative = sanitized.startsWith("-");
  const unsigned = isNegative ? sanitized.slice(1) : sanitized;
  const [integerPartRaw, decimalPartRaw = ""] = unsigned.split(".");
  const integerPart = integerPartRaw || "0";
  const decimalPart = decimalPartRaw.slice(0, scale).padEnd(scale, "0");

  const units = BigInt(`${integerPart}${decimalPart}`);
  return isNegative ? -units : units;
}

/** Parses a normalized value into scaled units, falling back to `0n`. */
export function parseNormalizedToScaledUnits(
  value: string | number,
  scale: number,
) {
  return parseNormalizedDraftToScaledUnits(value, scale) ?? 0n;
}

/** Converts numeric constraints into scaled BigInt units for reuse. */
export function getScaledConstraintUnits(
  min: number,
  max: number,
  step: number,
  scale: number,
): ScaledConstraintUnits {
  return {
    min: parseNormalizedToScaledUnits(min, scale),
    max: parseNormalizedToScaledUnits(max, scale),
    step: parseNormalizedToScaledUnits(step, scale),
    scale,
  };
}

/** Formats scaled units back into a normalized draft string. */
export function formatScaledUnitsToNormalized(value: bigint, scale: number) {
  if (scale <= 0) {
    return value.toString();
  }

  const isNegative = value < 0n;
  const absString = (isNegative ? -value : value)
    .toString()
    .padStart(scale + 1, "0");
  const integerPart = absString.slice(0, -scale);
  const decimalPart = absString.slice(-scale);
  const formatted = `${integerPart}.${decimalPart}`;

  return isNegative ? `-${formatted}` : formatted;
}

/** Clamps scaled units to an inclusive min/max range. */
export function clampScaledUnits(value: bigint, min: bigint, max: bigint) {
  return clampToRange(value, min, max);
}

/** Resolves the scaled value used as the starting point for stepping. */
export function getStepStartScaledUnits(
  draft: string,
  constraints: ScaledConstraintUnits,
) {
  const parsedDraft = parseNormalizedDraftToScaledUnits(draft, constraints.scale);

  if (parsedDraft === null) {
    return constraints.min;
  }

  return clampScaledUnits(parsedDraft, constraints.min, constraints.max);
}

/** Steps a normalized draft using precomputed scaled constraints. */
export function stepNormalizedDraftWithConstraints(
  draft: string,
  direction: 1 | -1,
  constraints: ScaledConstraintUnits,
) {
  const currentUnits = getStepStartScaledUnits(draft, constraints);

  const nextUnits = clampScaledUnits(
    currentUnits + constraints.step * BigInt(direction),
    constraints.min,
    constraints.max,
  );

  return formatScaledUnitsToNormalized(nextUnits, constraints.scale);
}

/** Returns whether a draft can step in the requested direction. */
export function getCanStepWithConstraints(
  draft: string,
  direction: 1 | -1,
  constraints: ScaledConstraintUnits,
) {
  const currentUnits = getStepStartScaledUnits(draft, constraints);

  return direction === 1
    ? currentUnits < constraints.max
    : currentUnits > constraints.min;
}

/** Convenience wrapper that steps a draft from raw numeric constraints. */
export function stepNormalizedDraft(
  draft: string,
  direction: 1 | -1,
  min: number,
  max: number,
  step: number,
  scale: number,
) {
  return stepNormalizedDraftWithConstraints(
    draft,
    direction,
    getScaledConstraintUnits(min, max, Math.abs(step), scale),
  );
}

/** Convenience wrapper that checks stepping from raw numeric constraints. */
export function getCanStep(
  draft: string,
  direction: 1 | -1,
  min: number,
  max: number,
  scale: number,
) {
  return getCanStepWithConstraints(
    draft,
    direction,
    getScaledConstraintUnits(min, max, 1, scale),
  );
}
