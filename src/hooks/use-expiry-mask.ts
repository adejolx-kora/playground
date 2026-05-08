import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

import {
  getCursorFromRightDigitRank,
  getRightDigitRankFromCursor,
  stripDigits,
} from "@/lib/utils";

type ExpiryYearFormat = "YY" | "YYYY";

type UseExpiryMaskArgs = {
  value: string;
  onChange: (raw: string) => void;
  yearFormat?: ExpiryYearFormat;
};

const normalizeMonth = (digits: string) => {
  if (!digits) return "";
  if (digits.length === 1) {
    return Number(digits) > 1 ? `0${digits}` : digits;
  }

  const month = Math.min(12, Math.max(1, Number(digits.slice(0, 2))));
  return String(month).padStart(2, "0");
};

const getMaxDigits = (yearFormat: ExpiryYearFormat) =>
  yearFormat === "YYYY" ? 6 : 4;

const normalizeExpiryDigits = (raw: string, yearFormat: ExpiryYearFormat) => {
  const maxDigits = getMaxDigits(yearFormat);
  let digits = stripDigits(raw).slice(0, maxDigits);

  if (!digits) return "";

  if (digits.length === 1) {
    return normalizeMonth(digits);
  }

  const month = normalizeMonth(digits.slice(0, 2));
  digits = `${month}${digits.slice(2, maxDigits)}`;

  return digits;
};

const formatExpiry = (digits: string) => {
  if (!digits) return "";
  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
};

export const useExpiryMask = ({
  value,
  onChange,
  yearFormat = "YY",
}: UseExpiryMaskArgs) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const maxDigits = useMemo(() => getMaxDigits(yearFormat), [yearFormat]);

  const normalizedValue = useMemo(
    () => normalizeExpiryDigits(value, yearFormat),
    [value, yearFormat],
  );

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    const formatted = formatExpiry(normalizedValue);
    if (inputRef.current.value !== formatted) {
      inputRef.current.value = formatted;
    }
  }, [normalizedValue]);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const next = normalizeExpiryDigits(
        e.clipboardData.getData("text"),
        yearFormat,
      );
      onChange(next);
    },
    [onChange, yearFormat],
  );

  const onInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const rightRank = getRightDigitRankFromCursor(
        el.value,
        el.selectionStart || 0,
      );

      const next = normalizeExpiryDigits(el.value, yearFormat);
      onChange(next);

      const formatted = formatExpiry(next);
      el.value = formatted;

      const newPos = getCursorFromRightDigitRank(formatted, rightRank);
      el.setSelectionRange(newPos, newPos);
    },
    [onChange, yearFormat],
  );

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const next = normalizeExpiryDigits(e.currentTarget.value, yearFormat);
      onChange(next);
    },
    [onChange, yearFormat],
  );

  const month =
    normalizedValue.length >= 2 ? Number(normalizedValue.slice(0, 2)) : 0;
  const isComplete = normalizedValue.length === maxDigits;

  return {
    ref: inputRef,
    onInput,
    onPaste,
    onBlur,
    inputMode: "numeric" as const,
    autoComplete: "cc-exp",
    placeholder: yearFormat === "YYYY" ? "MM / YYYY" : "MM / YY",
    isComplete,
    isValid: isComplete && month >= 1 && month <= 12,
  };
};
