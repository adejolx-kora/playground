import { Button } from "@korapay/react";
import { InputGroup, InputGroupInput } from "@korapay/react/molecules";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type NumericStepperContextValue = {
  value: string;
  disabled: boolean;
  min: string;
  max: string;
  scale: number;
  setValue: (value: string, options?: { clamp?: boolean }) => void;
  stepBy: (direction: 1 | -1) => void;
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

function hasDecimalSeparator(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return false;
  }

  return String(value).includes(".");
}

function sanitizeNumericInput(value: string, allowDecimal: boolean) {
  const onlyNumericChars = value.replace(/[^\d.]/g, "");

  if (!onlyNumericChars) {
    return "";
  }

  if (!allowDecimal) {
    const integerOnly = onlyNumericChars.replace(/\./g, "");
    const normalizedInteger = integerOnly.replace(/^0+(?=\d)/, "");

    return normalizedInteger || "0";
  }

  const firstDot = onlyNumericChars.indexOf(".");
  if (firstDot === -1) {
    const normalizedInteger = onlyNumericChars.replace(/^0+(?=\d)/, "");
    return normalizedInteger || "0";
  }

  const integerPart = onlyNumericChars.slice(0, firstDot).replace(/\./g, "");
  const decimalPart = onlyNumericChars.slice(firstDot + 1).replace(/\./g, "");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";

  return `${normalizedInteger}.${decimalPart}`;
}

function parseToScaledUnits(value: string | number, scale: number) {
  const sanitized = sanitizeNumericInput(String(value), scale > 0);

  if (!sanitized) {
    return 0n;
  }

  const [integerPartRaw, decimalPartRaw = ""] = sanitized.split(".");
  const integerPart = integerPartRaw || "0";
  const decimalPart = decimalPartRaw.slice(0, scale).padEnd(scale, "0");

  return BigInt(`${integerPart}${decimalPart}`);
}

function formatScaledUnits(value: bigint, scale: number) {
  if (scale <= 0) {
    return value.toString();
  }

  const valueString = value.toString().padStart(scale + 1, "0");
  const integerPart = valueString.slice(0, -scale);
  const decimalPart = valueString.slice(-scale).replace(/0+$/, "");

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

function normalizeRawValue(
  value: string | number | undefined,
  min: string,
  max: string,
  scale: number,
) {
  if (value === undefined || value === null) {
    return "";
  }

  const sanitized = sanitizeNumericInput(String(value), scale > 0);

  if (!sanitized) {
    return "";
  }

  const units = parseToScaledUnits(sanitized, scale);
  const minUnits = parseToScaledUnits(min, scale);
  const maxUnits = parseToScaledUnits(max, scale);
  const clampedUnits = clampToRange(units, minUnits, maxUnits);

  // Preserve in-progress decimal entry like "0.", "0.0", or "12.3400" while in range.
  if (scale > 0 && hasDecimalSeparator(sanitized) && clampedUnits === units) {
    return sanitized;
  }

  return formatScaledUnits(clampedUnits, scale);
}

type NumericStepperRootProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
  className?: string;
  children: React.ReactNode;
};

function NumericStepperRoot({
  value,
  defaultValue = "",
  onValueChange,
  min = 0,
  max = 1_000_000_000,
  step = 1,
  disabled = false,
  name,
  className,
  children,
}: NumericStepperRootProps) {
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

  const minValue = String(Math.max(0, min));
  const maxValue = String(Math.max(Number(minValue), max));
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState(() =>
    normalizeRawValue(defaultValue, minValue, maxValue, configuredScale),
  );

  const activeScale = React.useMemo(() => {
    const currentValue = isControlled ? value : internalValue;

    if (!hasDecimalSeparator(currentValue)) {
      return configuredScale;
    }

    return Math.max(configuredScale, 1, getFractionDigits(currentValue));
  }, [configuredScale, internalValue, isControlled, value]);

  const rawValue = normalizeRawValue(
    isControlled ? value : internalValue,
    minValue,
    maxValue,
    activeScale,
  );

  const latestValueRef = useLatestRef(rawValue);
  const latestScaleRef = useLatestRef(activeScale);
  const latestMinRef = useLatestRef(minValue);
  const latestMaxRef = useLatestRef(maxValue);
  const latestStepRef = useLatestRef(step);

  const setValue = React.useCallback(
    (nextValue: string, options?: { clamp?: boolean }) => {
      const clampValue = options?.clamp ?? true;
      const allowDecimal =
        latestScaleRef.current > 0 || hasDecimalSeparator(nextValue);
      const sanitized = sanitizeNumericInput(nextValue, allowDecimal);
      const targetScale = allowDecimal
        ? Math.max(latestScaleRef.current, 1, getFractionDigits(sanitized))
        : latestScaleRef.current;
      const normalized = clampValue
        ? normalizeRawValue(
            sanitized,
            latestMinRef.current,
            latestMaxRef.current,
            targetScale,
          )
        : sanitized;

      if (!isControlled) {
        setInternalValue(normalized);
      }

      onValueChange?.(normalized);
    },
    [isControlled, latestMaxRef, latestMinRef, latestScaleRef, onValueChange],
  );

  const stepBy = React.useCallback(
    (direction: 1 | -1) => {
      const currentValue =
        latestValueRef.current === ""
          ? latestMinRef.current
          : latestValueRef.current;
      const currentUnits = parseToScaledUnits(
        currentValue,
        latestScaleRef.current,
      );
      const minUnits = parseToScaledUnits(
        latestMinRef.current,
        latestScaleRef.current,
      );
      const maxUnits = parseToScaledUnits(
        latestMaxRef.current,
        latestScaleRef.current,
      );
      const scaledStep =
        parseToScaledUnits(
          Math.abs(latestStepRef.current) || 1,
          latestScaleRef.current,
        ) || 1n;

      const nextUnits = clampToRange(
        currentUnits + scaledStep * BigInt(direction),
        minUnits,
        maxUnits,
      );

      setValue(formatScaledUnits(nextUnits, latestScaleRef.current), {
        clamp: false,
      });
    },
    [
      latestMaxRef,
      latestMinRef,
      latestScaleRef,
      latestStepRef,
      latestValueRef,
      setValue,
    ],
  );

  const contextValue = React.useMemo<NumericStepperContextValue>(
    () => ({
      value: rawValue,
      disabled,
      min: minValue,
      max: maxValue,
      scale: activeScale,
      setValue,
      stepBy,
    }),
    [activeScale, disabled, maxValue, minValue, rawValue, setValue, stepBy],
  );

  return (
    <NumericStepperContext.Provider value={contextValue}>
      <InputGroup
        className={cn("h-10 w-full max-w-xs overflow-hidden", className)}
        data-slot="numeric-stepper-root"
      >
        {children}
      </InputGroup>
      {name ? <input type="hidden" name={name} value={rawValue} /> : null}
    </NumericStepperContext.Provider>
  );
}

type NumericStepperInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof InputGroupInput>,
  "defaultValue" | "inputMode" | "pattern" | "value"
>;

const NumericStepperInput = React.forwardRef<
  HTMLInputElement,
  NumericStepperInputProps
>(function NumericStepperInput({ className, ...props }, forwardedRef) {
  const { value, disabled, min, stepBy, setValue } = useNumericStepperContext();

  return (
    <InputGroupInput
      {...props}
      ref={forwardedRef}
      value={value}
      disabled={disabled || props.disabled}
      inputMode="decimal"
      pattern="[0-9]*[.]?[0-9]*"
      onKeyDown={(event) => {
        props.onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          stepBy(1);
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          stepBy(-1);
        }
      }}
      onInput={(event) => {
        setValue(event.currentTarget.value, { clamp: false });
        props.onInput?.(event);
      }}
      onBlur={(event) => {
        if (value === "") {
          setValue(min, { clamp: true });
        } else {
          setValue(value, { clamp: true });
        }

        props.onBlur?.(event);
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

function NumericStepperDecrement({
  className,
  children,
  ...props
}: NumericStepperControlProps) {
  const { value, disabled, min, max, stepBy } = useNumericStepperContext();
  const scale = Math.max(
    getFractionDigits(value),
    getFractionDigits(min),
    getFractionDigits(max),
  );
  const currentUnits = parseToScaledUnits(value || min, scale);
  const minUnits = parseToScaledUnits(min, scale);
  const canDecrement = currentUnits > minUnits;

  const { start, stop } = usePointerRepeat(() => {
    if (canDecrement) {
      stepBy(-1);
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
            stepBy(-1);
          }
        }
      }}
      className={cn(
        "h-full rounded-none border-0 bg-transparent px-3 text-input-text-secondary shadow-none focus-visible:ring-0",
        className,
      )}
    >
      {children ?? <MinusIcon size={16} weight="bold" />}
    </Button>
  );
}

function NumericStepperIncrement({
  className,
  children,
  ...props
}: NumericStepperControlProps) {
  const { value, disabled, min, max, stepBy } = useNumericStepperContext();
  const scale = Math.max(
    getFractionDigits(value),
    getFractionDigits(min),
    getFractionDigits(max),
  );
  const currentUnits = parseToScaledUnits(value || min, scale);
  const maxUnits = parseToScaledUnits(max, scale);
  const canIncrement = currentUnits < maxUnits;

  const { start, stop } = usePointerRepeat(() => {
    if (canIncrement) {
      stepBy(1);
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
            stepBy(1);
          }
        }
      }}
      className={cn(
        "h-full rounded-none border-0 bg-transparent px-3 text-input-text-secondary shadow-none focus-visible:ring-0",
        className,
      )}
    >
      {children ?? <PlusIcon size={16} weight="bold" />}
    </Button>
  );
}

export const NumericStepper = {
  Root: NumericStepperRoot,
  Input: NumericStepperInput,
  Decrease: NumericStepperDecrement,
  Increase: NumericStepperIncrement,
};
