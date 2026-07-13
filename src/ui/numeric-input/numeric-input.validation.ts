/** Validation helpers for the numeric input's normalized draft format. */

import type { ScaledConstraintUnits } from "./numeric-input.types";
import type { NumericInputValidity } from "./numeric-input.types";

import {
  getScaledConstraintUnits,
  parseNormalizedDraftToScaledUnits,
} from "./numeric-input.math";

/** Computes validity from a draft and precomputed scaled constraints. */
export function getNumericValidityWithConstraints({
  value,
  required,
  constraints,
}: {
  value: string;
  required: boolean;
  constraints: ScaledConstraintUnits;
}): NumericInputValidity {
  if (value === "") {
    const valueMissing = required;
    return {
      valueMissing,
      badInput: false,
      rangeUnderflow: false,
      rangeOverflow: false,
      stepMismatch: false,
      valid: !valueMissing,
    };
  }

  const parsedUnits = parseNormalizedDraftToScaledUnits(
    value,
    constraints.scale,
  );
  if (parsedUnits === null) {
    return {
      valueMissing: false,
      badInput: true,
      rangeUnderflow: false,
      rangeOverflow: false,
      stepMismatch: false,
      valid: false,
    };
  }

  const rangeUnderflow = parsedUnits < constraints.min;
  const rangeOverflow = parsedUnits > constraints.max;
  const stepMismatch =
    constraints.step > 0n &&
    (parsedUnits - constraints.min) % constraints.step !== 0n;

  return {
    valueMissing: false,
    badInput: false,
    rangeUnderflow,
    rangeOverflow,
    stepMismatch,
    valid: !rangeUnderflow && !rangeOverflow && !stepMismatch,
  };
}

/** Convenience wrapper that validates from raw numeric constraints. */
export function getNumericValidity({
  value,
  required,
  min,
  max,
  step,
  scale,
}: {
  value: string;
  required: boolean;
  min: number;
  max: number;
  step: number;
  scale: number;
}): NumericInputValidity {
  return getNumericValidityWithConstraints({
    value,
    required,
    constraints: getScaledConstraintUnits(min, max, step, scale),
  });
}
