import { Button } from "@korapay/react";
import { InputGroup, InputGroupInput } from "@korapay/react/molecules";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import * as React from "react";

import { usePointerRepeat } from "@/hooks/use-pointer-repeat";
import { cn } from "@/lib/utils";

import type {
  NumericInputValidity,
  NumericInputRootProps,
} from "./numeric-input.types.ts";

import {
  NumericInputUiContext,
  NumericInputValueContext,
} from "./numeric-input-context.tsx";
import {
  useNumericInputContext,
  useNumericInputFieldState,
  useNumericInputRootState,
  useNumericInputUiContext,
  useNumericInputValueContext,
} from "./numeric-input-hooks.tsx";
import {
  parseLocalizedDraftToNormalized,
  formatNormalizedToLocalizedDisplay,
} from "./numeric-input.locale.ts";
import { getCanStepWithConstraints } from "./numeric-input.math.ts";

/** Validates root-level numeric constraints before any state is created. */
function assertNumericInputProps({
  min,
  max,
  step,
}: {
  min: number;
  max: number;
  step: number;
}) {
  if (!Number.isFinite(min)) {
    throw new Error("NumericInput requires a finite min value.");
  }

  if (!Number.isFinite(max)) {
    throw new Error("NumericInput requires a finite max value.");
  }

  if (!Number.isFinite(step)) {
    throw new Error("NumericInput requires a finite step value.");
  }

  if (step <= 0) {
    throw new Error("NumericInput requires step to be greater than 0.");
  }

  if (max < min) {
    throw new Error(
      "NumericInput requires max to be greater than or equal to min.",
    );
  }
}

/** Root compound component that owns numeric-input state and context. */
export function NumericInputRoot({
  value,
  defaultValue = "",
  onValueChange,
  locale,
  dir,
  min = 0,
  max = 1_000_000_000,
  step = 1,
  disabled = false,
  className,
  children,
}: NumericInputRootProps) {
  assertNumericInputProps({ min, max, step });

  const { uiContextValue, valueContextValue } = useNumericInputRootState({
    value,
    defaultValue,
    onValueChange,
    locale,
    dir,
    min,
    max,
    step,
    disabled,
  });

  return (
    <NumericInputUiContext.Provider value={uiContextValue}>
      <NumericInputValueContext.Provider value={valueContextValue}>
        <InputGroup
          className={cn(
            "kora:h-10 kora:w-full kora:max-w-xs kora:overflow-hidden",
            className,
          )}
          data-slot="numeric-stepper-root"
          dir={uiContextValue.dir}
          data-dir={uiContextValue.dir}
        >
          {children}
        </InputGroup>
      </NumericInputValueContext.Provider>
    </NumericInputUiContext.Provider>
  );
}

type NumericInputFieldProps = Omit<
  React.ComponentPropsWithoutRef<typeof InputGroupInput>,
  "defaultValue" | "inputMode" | "pattern" | "type" | "value"
> & {
  /**
   * Maps internal validity flags to caller-owned validation text.
   *
   * Return an empty string to suppress browser validation UI.
   */
  getValidationMessage?: (validity: NumericInputValidity) => string;
  /** Disables text entry and arrow-key stepping for the field only. */
};

/** Text field that handles localized editing and normalized value emission. */
export const NumericInputField = React.forwardRef<
  HTMLInputElement,
  NumericInputFieldProps
>(function NumericInputField(
  { className, getValidationMessage: getMessageProp, ...props },
  forwardedRef,
) {
  const {
    value,
    locale,
    disabled,
    min,
    max,
    step,
    scale,
    setDraftFromInput,
    stepValue,
  } = useNumericInputContext();

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

  const { localeParts, validationScale, validity, ariaValueNow } =
    useNumericInputFieldState(
      value,
      locale,
      min,
      max,
      step,
      scale,
      props.required === true,
    );

  const [displayValue, setDisplayValue] = React.useState(() =>
    formatNormalizedToLocalizedDisplay(value, locale, validationScale),
  );

  const isTypingRef = React.useRef(false);

  const formatDisplayValue = React.useCallback(
    (nextValue: string) =>
      formatNormalizedToLocalizedDisplay(nextValue, locale, validationScale),
    [locale, validationScale],
  );

  React.useEffect(() => {
    if (!isTypingRef.current) {
      setDisplayValue(formatDisplayValue(value));
    }
  }, [formatDisplayValue, value]);

  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    if (!getMessageProp || validity.valid) {
      el.setCustomValidity("");
      return;
    }

    el.setCustomValidity(getMessageProp(validity) ?? "");
  }, [getMessageProp, validity]);

  return (
    <InputGroupInput
      {...props}
      ref={setRef}
      value={displayValue}
      disabled={disabled || props.disabled}
      inputMode="decimal"
      type="text"
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
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
          isTypingRef.current = false;
          if (!disabled && !props.disabled) {
            stepValue(1);
          }
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          isTypingRef.current = false;
          if (!disabled && !props.disabled) {
            stepValue(-1);
          }
        }
      }}
      onInput={(event) => {
        const rawInput = event.currentTarget.value;
        isTypingRef.current = true;
        setDisplayValue(rawInput);
        setDraftFromInput(
          parseLocalizedDraftToNormalized(rawInput, localeParts),
        );
        props.onInput?.(event);
      }}
      onBlur={(event) => {
        isTypingRef.current = false;

        const normalized = parseLocalizedDraftToNormalized(
          event.currentTarget.value,
          localeParts,
        );

        if (normalized !== value) {
          setDraftFromInput(normalized);
        }

        setDisplayValue(formatDisplayValue(normalized));

        props.onBlur?.(event);
      }}
      className={cn(
        "kora:min-w-0 kora:flex-1 kora:text-center kora:tabular-nums",
        className,
      )}
    />
  );
});

type NumericInputControlProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "children" | "type" | "variant"
> & {
  children?: React.ReactNode;
};

type NumericInputControlsProps = React.ComponentPropsWithoutRef<"div">;
type NumericInputStepButtonProps = NumericInputControlProps & {
  direction: 1 | -1;
  defaultAriaLabel: string;
  icon: React.ReactNode;
  className: string;
};

/** Layout wrapper for the increment and decrement controls. */
export function NumericInputControls({
  className,
  ...props
}: NumericInputControlsProps) {
  const { dir } = useNumericInputUiContext();

  return (
    <div
      {...props}
      data-slot="numeric-stepper-controls"
      className={cn(
        "kora:flex kora:h-full kora:shrink-0 kora:flex-col kora:overflow-hidden kora:border-input-border",
        dir === "rtl" ? "kora:border-r" : "kora:border-l",
        className,
      )}
    />
  );
}

/** Shared step-button implementation used by increment and decrement controls. */
function NumericInputStepButton({
  direction,
  defaultAriaLabel,
  icon,
  className,
  children,
  ...props
}: NumericInputStepButtonProps) {
  const { disabled, stepConstraints } = useNumericInputUiContext();
  const { value, stepValue } = useNumericInputValueContext();
  const canStep = getCanStepWithConstraints(value, direction, stepConstraints);

  const { start, stop } = usePointerRepeat(() => {
    if (canStep) {
      stepValue(direction);
    }
  });

  return (
    <Button
      {...props}
      type="button"
      variant="neutral-ghost"
      data-slot="input-group-control"
      aria-label={props["aria-label"] ?? defaultAriaLabel}
      disabled={disabled || props.disabled || !canStep}
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
          if (canStep) {
            stepValue(direction);
          }
        }
      }}
      className={cn(
        "kora:h-1/2 kora:min-h-0 kora:rounded-none kora:border-0 kora:border-t kora:border-input-border kora:bg-transparent kora:p-0 kora:text-input-text-secondary kora:shadow-none kora:focus-visible:ring-0",
        className,
      )}
    >
      {children ?? icon}
    </Button>
  );
}

/** Button that steps the current value downward. */
export function NumericInputDecrement({
  className,
  children,
  ...props
}: NumericInputControlProps) {
  return (
    <NumericInputStepButton
      {...props}
      direction={-1}
      defaultAriaLabel="Decrease value"
      icon={<CaretDownIcon weight="bold" />}
      className={cn(
        "kora:h-1/2 kora:min-h-0 kora:rounded-none kora:border-0 kora:border-t kora:border-input-border kora:bg-transparent kora:p-0 kora:text-input-text-secondary kora:shadow-none kora:focus-visible:ring-0",
        className,
      )}
    >
      {children}
    </NumericInputStepButton>
  );
}

/** Button that steps the current value upward. */
export function NumericInputIncrement({
  className,
  children,
  ...props
}: NumericInputControlProps) {
  return (
    <NumericInputStepButton
      {...props}
      direction={1}
      defaultAriaLabel="Increase value"
      icon={<CaretUpIcon weight="bold" />}
      className={cn(
        "kora:h-1/2 kora:min-h-0 kora:rounded-none kora:border-0 kora:bg-transparent kora:p-0 kora:text-input-text-secondary kora:shadow-none kora:focus-visible:ring-0",
        className,
      )}
    >
      {children}
    </NumericInputStepButton>
  );
}
