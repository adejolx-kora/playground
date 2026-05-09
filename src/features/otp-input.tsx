import { Input } from "@korapay/react";
import React from "react";

import { cn } from "@/lib/utils";

type OtpInputContextValue = {
  length: number;
  value: string;
  disabled: boolean;
  setAt: (index: number, char: string) => void;
  setRangeAt: (start: number, chars: string[]) => void;
  focusSlot: (index: number) => void;
  registerSlot: (index: number, node: HTMLInputElement | null) => void;
};

const OtpInputContext = React.createContext<OtpInputContextValue | null>(null);

function useOtpInputContext() {
  const context = React.useContext(OtpInputContext);

  if (!context) {
    throw new Error("OTP input components must be used inside OTPInputRoot");
  }

  return context;
}

type OTPInputRootProps = {
  value?: string;
  defaultValue?: string;
  length?: number;
  name?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

function normalizeOTP(value: string, length: number) {
  return value.replace(/\D/g, "").slice(0, length);
}

function OTPInputRoot({
  value,
  defaultValue = "",
  length = 6,
  name,
  disabled = false,
  onValueChange,
  onComplete,
  children,
  className,
}: OTPInputRootProps) {
  const [internalValue, setInternalValue] = React.useState(() =>
    normalizeOTP(defaultValue, length),
  );
  const isControlled = value !== undefined;
  const otpValue = normalizeOTP(isControlled ? value : internalValue, length);
  const slotsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const updateValue = React.useCallback(
    (nextValue: string) => {
      const normalized = normalizeOTP(nextValue, length);

      if (!isControlled) {
        setInternalValue(normalized);
      }

      onValueChange?.(normalized);

      if (normalized.length === length) {
        onComplete?.(normalized);
      }
    },
    [isControlled, length, onComplete, onValueChange],
  );

  const setAt = React.useCallback(
    (index: number, char: string) => {
      if (index < 0 || index >= length) return;

      const chars = otpValue.padEnd(length, " ").split("");
      chars[index] = char;

      updateValue(chars.join("").replace(/\s/g, ""));
    },
    [length, otpValue, updateValue],
  );

  const setRangeAt = React.useCallback(
    (start: number, chars: string[]) => {
      if (start < 0 || start >= length || chars.length === 0) return;

      const next = otpValue.padEnd(length, " ").split("");

      chars.forEach((char, offset) => {
        const targetIndex = start + offset;
        if (targetIndex < length) {
          next[targetIndex] = char;
        }
      });

      updateValue(next.join("").replace(/\s/g, ""));
    },
    [length, otpValue, updateValue],
  );

  const focusSlot = React.useCallback(
    (index: number) => {
      if (index < 0) return;

      const nextIndex = Math.max(0, Math.min(index, length - 1));
      slotsRef.current[nextIndex]?.focus();
    },
    [length],
  );

  const registerSlot = React.useCallback(
    (index: number, node: HTMLInputElement | null) => {
      slotsRef.current[index] = node;
    },
    [],
  );

  const contextValue = React.useMemo<OtpInputContextValue>(
    () => ({
      length,
      value: otpValue,
      disabled,
      setAt,
      setRangeAt,
      focusSlot,
      registerSlot,
    }),
    [disabled, focusSlot, length, otpValue, registerSlot, setAt, setRangeAt],
  );

  return (
    <OtpInputContext.Provider value={contextValue}>
      <div className={className}>
        {children}
        {name ? <input type="hidden" name={name} value={otpValue} /> : null}
      </div>
    </OtpInputContext.Provider>
  );
}

type OTPInputGroupProps = React.ComponentPropsWithoutRef<"div">;

function OTPInputGroup({ className, ...props }: OTPInputGroupProps) {
  return (
    <div
      className={cn("flex w-full items-center gap-1.5 sm:gap-2", className)}
      {...props}
    />
  );
}

type OTPInputSlotProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "value" | "defaultValue" | "onChange" | "maxLength"
> & {
  index: number;
};

function OTPInputSlot({
  index,
  className,
  onKeyDown,
  onPaste,
  onFocus,
  ...props
}: OTPInputSlotProps) {
  const {
    value,
    length,
    disabled,
    setAt,
    setRangeAt,
    focusSlot,
    registerSlot,
  } = useOtpInputContext();
  const slotValue = value[index] ?? "";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value.replace(/\D/g, "");
    const lastDigit = next.slice(-1);

    if (!lastDigit && slotValue) {
      setAt(index, "");
      return;
    }

    if (!lastDigit) return;

    setAt(index, lastDigit);

    if (index < length - 1) {
      focusSlot(index + 1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "Backspace") {
      event.preventDefault();

      if (slotValue) {
        setAt(index, "");
        return;
      }

      const prevIndex = index - 1;

      if (prevIndex >= 0) {
        setAt(prevIndex, "");
        focusSlot(prevIndex);
      }
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusSlot(index - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusSlot(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();

    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .split("")
      .slice(0, length - index);

    if (pastedDigits.length === 0) return;

    setRangeAt(index, pastedDigits);

    const nextIndex = Math.min(index + pastedDigits.length, length - 1);
    focusSlot(nextIndex);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
    event.currentTarget.select();
  };

  return (
    <Input
      {...props}
      ref={(node) => registerSlot(index, node)}
      value={slotValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={handleFocus}
      maxLength={1}
      inputMode="numeric"
      autoComplete={index === 0 ? "one-time-code" : "off"}
      disabled={disabled || props.disabled}
      className={cn(
        "aspect-square min-w-0 flex-1 max-w-12 px-0 text-center text-label-md tabular-nums",
        className,
      )}
    />
  );
}

type OTPInputSeparatorProps = React.ComponentPropsWithoutRef<"span">;

function OTPInputSeparator({ className, ...props }: OTPInputSeparatorProps) {
  return (
    <span
      aria-hidden
      className={cn("text-content-default-tertiary", className)}
      {...props}
    />
  );
}

export { OTPInputGroup, OTPInputRoot, OTPInputSeparator, OTPInputSlot };
