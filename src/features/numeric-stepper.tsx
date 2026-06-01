import { Button } from "@korapay/react";
import { InputGroup, InputGroupInput } from "@korapay/react/molecules";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type NumericStepperContextValue = {
  value: string;
  disabled: boolean;
  min: number;
  max: number;
  step: number;
  scale: number;
  setDraftFromInput: (value: string) => void;
  stepValue: (direction: 1 | -1) => void;
};

const NumericStepperContext =
  React.createContext<NumericStepperContextValue | null>(null);

function usePointerRepeat(action: () => void) {
  const actionRef = React.useRef(action);
  const timeoutRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    actionRef.current = action;
  }, [action]);

  const stop = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  React.useEffect(() => stop, [stop]);

  const start = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      stop();
      actionRef.current();

      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          actionRef.current();
        }, 80);
      }, 320);
    },
    [stop],
  );

  return { start, stop };
}

function useNumericStepperContext() {
  const context = React.useContext(NumericStepperContext);

  if (!context) {
    throw new Error(
      "NumericStepper components must be used inside NumericStepper.Root",
    );
  }

  return context;
}

function useLatestRef<T>(value: T) {
  const ref = React.useRef(value);

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

function clampToRange(value: bigint, min: bigint, max: bigint) {
  return value < min ? min : value > max ? max : value;
}

function getFractionDigits(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return 0;
  }

  const stringValue = String(value);
  const dotIndex = stringValue.indexOf(".");

  if (dotIndex === -1) {
    return 0;
  }

  return stringValue.length - dotIndex - 1;
}

function sanitizeDraft(value: string) {
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

function isParseableNumericDraft(draft: string) {
  if (!draft || draft === "-" || draft === "." || draft === "-.") {
    return false;
  }

  return /^-?\d*(\.\d*)?$/.test(draft);
}

function parseDraftToScaledUnits(value: string | number, scale: number) {
  const sanitized = sanitizeDraft(String(value));

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

function parseToScaledUnits(value: string | number, scale: number) {
  return parseDraftToScaledUnits(value, scale) ?? 0n;
}

function formatScaledUnits(value: bigint, scale: number) {
  if (scale <= 0) {
    return value.toString();
  }

  const isNegative = value < 0n;
  const absString = (isNegative ? -value : value)
    .toString()
    .padStart(scale + 1, "0");
  const integerPart = absString.slice(0, -scale);
  const decimalPart = absString.slice(-scale).replace(/0+$/, "");
  const formatted = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;

  return isNegative ? `-${formatted}` : formatted;
}

function clampScaledUnits(value: bigint, min: bigint, max: bigint) {
  return clampToRange(value, min, max);
}

function getStepStartUnits(
  draft: string,
  minUnits: bigint,
  maxUnits: bigint,
  scale: number,
) {
  const parsedDraft = parseDraftToScaledUnits(draft, scale);

  if (parsedDraft === null) {
    return minUnits;
  }

  return clampScaledUnits(parsedDraft, minUnits, maxUnits);
}

function stepDraft(
  draft: string,
  direction: 1 | -1,
  min: number,
  max: number,
  step: number,
  scale: number,
) {
  const minUnits = parseToScaledUnits(min, scale);
  const maxUnits = parseToScaledUnits(max, scale);
  const currentUnits = getStepStartUnits(draft, minUnits, maxUnits, scale);
  const scaledStep = parseDraftToScaledUnits(Math.abs(step), scale) ?? 1n;

  const nextUnits = clampScaledUnits(
    currentUnits + scaledStep * BigInt(direction),
    minUnits,
    maxUnits,
  );

  return formatScaledUnits(nextUnits, scale);
}

function getCanStep(
  draft: string,
  direction: 1 | -1,
  min: number,
  max: number,
  scale: number,
) {
  const minUnits = parseToScaledUnits(min, scale);
  const maxUnits = parseToScaledUnits(max, scale);
  const currentUnits = getStepStartUnits(draft, minUnits, maxUnits, scale);

  return direction === 1 ? currentUnits < maxUnits : currentUnits > minUnits;
}

type NumericStepperRootProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

export type NumericStepperValidity = {
  valueMissing: boolean;
  badInput: boolean;
  rangeUnderflow: boolean;
  rangeOverflow: boolean;
  stepMismatch: boolean;
  valid: boolean;
};

function getNumericValidity({
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
}): NumericStepperValidity {
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

  const parsedUnits = parseDraftToScaledUnits(value, scale);
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

  const minUnits = parseToScaledUnits(min, scale);
  const maxUnits = parseToScaledUnits(max, scale);
  const rangeUnderflow = parsedUnits < minUnits;
  const rangeOverflow = parsedUnits > maxUnits;
  const stepUnits = parseToScaledUnits(step, scale);
  const stepMismatch =
    stepUnits > 0n && (parsedUnits - minUnits) % stepUnits !== 0n;

  return {
    valueMissing: false,
    badInput: false,
    rangeUnderflow,
    rangeOverflow,
    stepMismatch,
    valid: !rangeUnderflow && !rangeOverflow && !stepMismatch,
  };
}

function NumericStepperRoot({
  value,
  defaultValue = "",
  onValueChange,
  min = 0,
  max = 1_000_000_000,
  step = 1,
  disabled = false,
  className,
  children,
}: NumericStepperRootProps) {
  if (!Number.isFinite(min)) {
    throw new Error("NumericStepper requires a finite min value.");
  }

  if (!Number.isFinite(max)) {
    throw new Error("NumericStepper requires a finite max value.");
  }

  if (!Number.isFinite(step)) {
    throw new Error("NumericStepper requires a finite step value.");
  }

  if (step <= 0) {
    throw new Error("NumericStepper requires step to be greater than 0.");
  }

  if (max < min) {
    throw new Error(
      "NumericStepper requires max to be greater than or equal to min.",
    );
  }

  const configuredScale = React.useMemo(
    () =>
      Math.max(
        getFractionDigits(min),
        getFractionDigits(max),
        getFractionDigits(step),
        getFractionDigits(value),
        getFractionDigits(defaultValue),
      ),
    [defaultValue, max, min, step, value],
  );

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState(() =>
    sanitizeDraft(String(defaultValue)),
  );

  const draftValue = isControlled
    ? sanitizeDraft(String(value ?? ""))
    : internalValue;

  const activeScale = React.useMemo(
    () => Math.max(configuredScale, getFractionDigits(draftValue)),
    [configuredScale, draftValue],
  );

  const latestDraftRef = useLatestRef(draftValue);
  const latestScaleRef = useLatestRef(activeScale);
  const latestMinRef = useLatestRef(min);
  const latestMaxRef = useLatestRef(max);
  const latestStepRef = useLatestRef(step);

  const setDraftFromInput = React.useCallback(
    (nextInput: string) => {
      const nextValue = sanitizeDraft(nextInput);

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
      const steppedValue = stepDraft(
        latestDraftRef.current,
        direction,
        latestMinRef.current,
        latestMaxRef.current,
        latestStepRef.current,
        latestScaleRef.current,
      );

      if (!isControlled) {
        setInternalValue(steppedValue);
      }

      if (steppedValue !== latestDraftRef.current) {
        onValueChange?.(steppedValue);
      }
    },
    [
      latestDraftRef,
      latestMaxRef,
      latestMinRef,
      latestScaleRef,
      latestStepRef,
      isControlled,
      onValueChange,
    ],
  );

  const contextValue = React.useMemo<NumericStepperContextValue>(
    () => ({
      value: draftValue,
      disabled,
      min,
      max,
      step,
      scale: activeScale,
      setDraftFromInput,
      stepValue,
    }),
    [
      activeScale,
      disabled,
      draftValue,
      max,
      min,
      setDraftFromInput,
      step,
      stepValue,
    ],
  );

  return (
    <NumericStepperContext.Provider value={contextValue}>
      <InputGroup
        className={cn("h-10 w-full max-w-xs overflow-hidden", className)}
        data-slot="numeric-stepper-root"
      >
        {children}
      </InputGroup>
    </NumericStepperContext.Provider>
  );
}

type NumericStepperInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof InputGroupInput>,
  "defaultValue" | "inputMode" | "pattern" | "type" | "value"
> & {
  /**
   * Optional. When provided, enables custom numeric form validation via
   * `setCustomValidity`.
   *
   * - `data-invalid` and `aria-invalid` are always driven by internal numeric validity.
   * - Custom numeric browser form-blocking/tooltip behavior is opt-in: supply this prop
   *   and return a non-empty string when invalid.
   * - Native constraints passed to the input, such as `required`, may still use the
   *   browser's built-in validation behavior.
   * - Return an empty string, or omit this prop, to skip custom numeric validation UI.
   * - The primitive never hard-codes validation messages; all custom copy lives in the caller.
   */
  getValidationMessage?: (validity: NumericStepperValidity) => string;
};

const NumericStepperInput = React.forwardRef<
  HTMLInputElement,
  NumericStepperInputProps
>(function NumericStepperInput(
  { className, getValidationMessage: getMessageProp, ...props },
  forwardedRef,
) {
  const {
    value,
    disabled,
    min,
    max,
    step,
    scale,
    setDraftFromInput,
    stepValue,
  } = useNumericStepperContext();

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;

      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  const validationScale = React.useMemo(
    () =>
      Math.max(
        scale,
        getFractionDigits(value),
        getFractionDigits(min),
        getFractionDigits(max),
        getFractionDigits(step),
      ),
    [max, min, scale, step, value],
  );

  const validity = React.useMemo(
    () =>
      getNumericValidity({
        value,
        required: props.required === true,
        min,
        max,
        step,
        scale: validationScale,
      }),
    [max, min, props.required, step, validationScale, value],
  );

  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    if (!getMessageProp || validity.valid) {
      el.setCustomValidity("");
      return;
    }

    el.setCustomValidity(getMessageProp(validity) ?? "");
  }, [getMessageProp, validity]);

  const ariaValueNow = React.useMemo(() => {
    const parsedUnits = parseDraftToScaledUnits(value, validationScale);
    if (parsedUnits === null) return undefined;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }, [validationScale, value]);

  return (
    <InputGroupInput
      {...props}
      ref={setRef}
      value={value}
      disabled={disabled || props.disabled}
      inputMode="decimal"
      pattern="-?[0-9]*[.]?[0-9]*"
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      type="text"
      aria-valuenow={ariaValueNow}
      aria-invalid={validity.valid ? undefined : true}
      data-invalid={validity.valid ? undefined : true}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          stepValue(1);
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          stepValue(-1);
        }
      }}
      onInput={(event) => {
        setDraftFromInput(event.currentTarget.value);
        props.onInput?.(event);
      }}
      className={cn("min-w-0 flex-1 text-center tabular-nums", className)}
    />
  );
});

type NumericStepperControlProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "children" | "type" | "variant"
> & {
  children?: React.ReactNode;
};

type NumericStepperControlsProps = React.ComponentPropsWithoutRef<"div">;

function NumericStepperControls({
  className,
  ...props
}: NumericStepperControlsProps) {
  return (
    <div
      {...props}
      data-slot="numeric-stepper-controls"
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-l border-input-border",
        className,
      )}
    />
  );
}

function NumericStepperDecrement({
  className,
  children,
  ...props
}: NumericStepperControlProps) {
  const { value, disabled, min, max, scale, stepValue } =
    useNumericStepperContext();
  const canDecrement = getCanStep(value, -1, min, max, scale);

  const { start, stop } = usePointerRepeat(() => {
    if (canDecrement) {
      stepValue(-1);
    }
  });

  return (
    <Button
      {...props}
      type="button"
      variant="neutral-ghost"
      data-slot="input-group-control"
      aria-label={props["aria-label"] ?? "Decrease value"}
      disabled={disabled || props.disabled || !canDecrement}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        if (!event.defaultPrevented) {
          start(event);
        }
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event);
        stop();
      }}
      onPointerCancel={(event) => {
        props.onPointerCancel?.(event);
        stop();
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event);
        stop();
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (canDecrement) {
            stepValue(-1);
          }
        }
      }}
      className={cn(
        "h-1/2 min-h-0 rounded-none border-0 border-t border-input-border bg-transparent p-0 text-input-text-secondary shadow-none focus-visible:ring-0",
        className,
      )}
    >
      {children ?? <CaretDownIcon weight="bold" />}
    </Button>
  );
}

function NumericStepperIncrement({
  className,
  children,
  ...props
}: NumericStepperControlProps) {
  const { value, disabled, min, max, scale, stepValue } =
    useNumericStepperContext();
  const canIncrement = getCanStep(value, 1, min, max, scale);

  const { start, stop } = usePointerRepeat(() => {
    if (canIncrement) {
      stepValue(1);
    }
  });

  return (
    <Button
      {...props}
      type="button"
      variant="neutral-ghost"
      data-slot="input-group-control"
      aria-label={props["aria-label"] ?? "Increase value"}
      disabled={disabled || props.disabled || !canIncrement}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        if (!event.defaultPrevented) {
          start(event);
        }
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event);
        stop();
      }}
      onPointerCancel={(event) => {
        props.onPointerCancel?.(event);
        stop();
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event);
        stop();
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (canIncrement) {
            stepValue(1);
          }
        }
      }}
      className={cn(
        "h-1/2 min-h-0 rounded-none border-0 bg-transparent p-0 text-input-text-secondary shadow-none focus-visible:ring-0",
        className,
      )}
    >
      {children ?? <CaretUpIcon weight="bold" />}
    </Button>
  );
}

export const NumericStepper = {
  Root: NumericStepperRoot,
  Input: NumericStepperInput,
  Controls: NumericStepperControls,
  Decrease: NumericStepperDecrement,
  Increase: NumericStepperIncrement,
};
