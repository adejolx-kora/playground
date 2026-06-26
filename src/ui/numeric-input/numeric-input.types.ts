import * as React from "react";

/** Visual direction used for layout and locale-aware controls. */
export type Direction = "ltr" | "rtl";

/** Min/max/step values converted to scaled BigInt units for arithmetic. */
export type ScaledConstraintUnits = {
  min: bigint;
  max: bigint;
  step: bigint;
  scale: number;
};

/** Locale-specific symbols needed to parse a user-visible numeric draft. */
export type LocaleParts = {
  decimal: string;
  group: string;
  minusSign: string;
  digits: Map<string, string>;
  decimalSeparators: string[];
  groupSeparators: string[];
  minusSigns: string[];
};

/** Stable UI configuration shared across numeric input subcomponents. */
export type NumericInputUiContextValue = {
  locale: string;
  dir: Direction;
  disabled: boolean;
  min: number;
  max: number;
  step: number;
  scale: number;
  stepConstraints: ScaledConstraintUnits;
};

/** Mutable value state and actions shared across numeric input subcomponents. */
export type NumericInputValueContextValue = {
  value: string;
  setDraftFromInput: (value: string) => void;
  stepValue: (direction: 1 | -1) => void;
};

/** HTML-like validity flags exposed by the primitive. */
export type NumericInputValidity = {
  valueMissing: boolean;
  badInput: boolean;
  rangeUnderflow: boolean;
  rangeOverflow: boolean;
  stepMismatch: boolean;
  valid: boolean;
};

/**
 * Props for the numeric input root.
 *
 * `value` and `defaultValue` use the normalized draft format:
 * ASCII digits, `"."` as the decimal separator, and optional leading `"-"`.
 */
export type NumericInputRootProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  locale?: Intl.LocalesArgument;
  dir?: Direction;
  min?: number;
  max?: number;
  step?: number;
  /** Disables the field and step controls together. */
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};
