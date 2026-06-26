import * as React from "react";

import {
  NumericInputUiContext,
  NumericInputValueContext,
} from "./numeric-input-context.tsx";
import {
  getMaxFractionDigits,
  parseNormalizedDraftToScaledUnits,
  getScaledConstraintUnits,
  sanitizeNumericDraft,
  stepNormalizedDraftWithConstraints,
} from "./numeric-input.math.ts";
import {
  getNumberLocaleParts,
  getResolvedDirection,
  getResolvedLocale,
} from "./numeric-input.locale.ts";
import type {
  NumericInputUiContextValue,
  NumericInputValueContextValue,
} from "./numeric-input.types.ts";
import { getNumericValidityWithConstraints } from "./numeric-input.validation.ts";

/** Stores the latest value without changing callback identities. */
function useLatestRef<T>(value: T) {
  const ref = React.useRef(value);

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

type NumericInputRootStateProps = {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  locale?: Intl.LocalesArgument;
  dir?: "ltr" | "rtl";
  min: number;
  max: number;
  step: number;
  disabled: boolean;
};

/** Reads both numeric-input contexts and returns a merged view for the field. */
export function useNumericInputContext() {
  const ui = React.useContext(NumericInputUiContext);
  const value = React.useContext(NumericInputValueContext);

  if (!ui || !value) {
    throw new Error(
      "NumericInput components must be used inside NumericInput.Root",
    );
  }

  return { ...ui, ...value };
}

/** Reads the UI configuration context. */
export function useNumericInputUiContext() {
  const context = React.useContext(NumericInputUiContext);

  if (!context) {
    throw new Error(
      "NumericInput components must be used inside NumericInput.Root",
    );
  }

  return context;
}

/** Reads the mutable value/action context. */
export function useNumericInputValueContext() {
  const context = React.useContext(NumericInputValueContext);

  if (!context) {
    throw new Error(
      "NumericInput components must be used inside NumericInput.Root",
    );
  }

  return context;
}

/** Builds root-owned state, locale config, and step actions for the compound API. */
export function useNumericInputRootState({
  value,
  defaultValue,
  onValueChange,
  locale,
  dir,
  min,
  max,
  step,
  disabled,
}: NumericInputRootStateProps) {
  const isControlled = value !== undefined;

  const configuredScale = React.useMemo(
    () =>
      getMaxFractionDigits(
        min,
        max,
        step,
        value,
        isControlled ? undefined : defaultValue,
      ),
    [defaultValue, isControlled, max, min, step, value],
  );

  const resolvedLocale = React.useMemo(
    () => getResolvedLocale(locale),
    [locale],
  );

  const resolvedDir = React.useMemo(
    () => getResolvedDirection(dir),
    [dir],
  );

  const [internalValue, setInternalValue] = React.useState(() =>
    sanitizeNumericDraft(String(defaultValue)),
  );

  const draftValue = isControlled
    ? sanitizeNumericDraft(String(value ?? ""))
    : internalValue;

  const activeScale = React.useMemo(
    () => Math.max(configuredScale, getMaxFractionDigits(draftValue)),
    [configuredScale, draftValue],
  );

  const stepConstraints = React.useMemo(
    () => getScaledConstraintUnits(min, max, step, activeScale),
    [activeScale, max, min, step],
  );

  const latestDraftRef = useLatestRef(draftValue);
  const latestStepConstraintsRef = useLatestRef(stepConstraints);

  const setDraftFromInput = React.useCallback(
    (nextInput: string) => {
      const nextValue = sanitizeNumericDraft(nextInput);

      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (nextValue !== latestDraftRef.current) {
        onValueChange?.(nextValue);
      }
    },
    [isControlled, latestDraftRef, onValueChange],
  );

  const stepValue = React.useCallback(
    (direction: 1 | -1) => {
      const steppedValue = stepNormalizedDraftWithConstraints(
        latestDraftRef.current,
        direction,
        latestStepConstraintsRef.current,
      );

      if (!isControlled) {
        setInternalValue(steppedValue);
      }

      if (steppedValue !== latestDraftRef.current) {
        onValueChange?.(steppedValue);
      }
    },
    [isControlled, latestDraftRef, latestStepConstraintsRef, onValueChange],
  );

  const uiContextValue = React.useMemo<NumericInputUiContextValue>(
    () => ({
      locale: resolvedLocale,
      dir: resolvedDir,
      disabled,
      min,
      max,
      step,
      scale: activeScale,
      stepConstraints,
    }),
    [
      activeScale,
      disabled,
      max,
      min,
      resolvedDir,
      resolvedLocale,
      step,
      stepConstraints,
    ],
  );

  const valueContextValue = React.useMemo<NumericInputValueContextValue>(
    () => ({
      value: draftValue,
      setDraftFromInput,
      stepValue,
    }),
    [draftValue, setDraftFromInput, stepValue],
  );

  return { uiContextValue, valueContextValue };
}

/** Derives field-only parsing, validation, and accessibility state. */
export function useNumericInputFieldState(
  value: string,
  locale: string,
  min: number,
  max: number,
  step: number,
  scale: number,
  required: boolean,
) {
  const localeParts = React.useMemo(
    () => getNumberLocaleParts(locale),
    [locale],
  );

  const validationScale = React.useMemo(
    () => Math.max(scale, getMaxFractionDigits(value, min, max, step)),
    [max, min, scale, step, value],
  );

  const validationConstraints = React.useMemo(
    () => getScaledConstraintUnits(min, max, step, validationScale),
    [max, min, step, validationScale],
  );

  const validity = React.useMemo(
    () =>
      getNumericValidityWithConstraints({
        value,
        required,
        constraints: validationConstraints,
      }),
    [required, validationConstraints, value],
  );

  const ariaValueNow = React.useMemo(() => {
    const parsedUnits = parseNormalizedDraftToScaledUnits(value, validationScale);
    if (parsedUnits === null) return undefined;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }, [validationScale, value]);

  return {
    localeParts,
    validationScale,
    validity,
    ariaValueNow,
  };
}
