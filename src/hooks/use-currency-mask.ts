import { useLayoutEffect, useRef, useCallback, useMemo } from "react";

import {
  getCursorFromRightDigitRank,
  getRightDigitRankFromCursor,
  stripDigits,
} from "@/lib/utils";

const formatters = new Map<string, Intl.NumberFormat>();
const MAX_SAFE_INTEGER_DIGITS = String(Number.MAX_SAFE_INTEGER);

const clampToSafeIntegerDigits = (value: string) => {
  const digits = stripDigits(value);

  if (digits.length < MAX_SAFE_INTEGER_DIGITS.length) {
    return digits;
  }

  if (digits.length > MAX_SAFE_INTEGER_DIGITS.length) {
    return MAX_SAFE_INTEGER_DIGITS;
  }

  return digits > MAX_SAFE_INTEGER_DIGITS ? MAX_SAFE_INTEGER_DIGITS : digits;
};

const normalizeDecimalInput = (value: string) => {
  const sanitized = value.replace(/[^\d.]/g, "");

  if (!sanitized) {
    return "";
  }

  const firstDotIndex = sanitized.indexOf(".");

  if (firstDotIndex === -1) {
    return sanitized;
  }

  const integerPart = sanitized.slice(0, firstDotIndex).replace(/\./g, "");
  const fractionPart = sanitized.slice(firstDotIndex + 1).replace(/\./g, "");

  return `${integerPart}.${fractionPart}`;
};

const parseDecimalToRaw = (value: string, fractionDigits: number) => {
  const normalized = normalizeDecimalInput(value);

  if (!normalized) {
    return "";
  }

  if (fractionDigits <= 0) {
    return clampToSafeIntegerDigits(stripDigits(normalized));
  }

  const [integerPartRaw, fractionPartRaw = ""] = normalized.split(".");
  const integerPart = stripDigits(integerPartRaw);
  const fractionPart = stripDigits(fractionPartRaw)
    .slice(0, fractionDigits)
    .padEnd(fractionDigits, "0");

  const raw = `${integerPart}${fractionPart}`.replace(/^0+(?=\d)/, "");
  return clampToSafeIntegerDigits(raw);
};

const rawToDecimalValue = (raw: string, fractionDigits: number) => {
  if (!raw) {
    return "";
  }

  if (fractionDigits <= 0) {
    return raw;
  }

  const padded = raw.padStart(fractionDigits + 1, "0");
  const integerPart = padded.slice(0, -fractionDigits).replace(/^0+(?=\d)/, "");
  const fractionPart = padded.slice(-fractionDigits);

  return `${integerPart || "0"}.${fractionPart}`;
};

const normalizeRawValue = (value: string | number, fractionDigits: number) => {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      return "";
    }

    return parseDecimalToRaw(String(value), fractionDigits);
  }

  return parseDecimalToRaw(value, fractionDigits);
};

const getLocalizedDigits = (locale: Intl.LocalesArgument) =>
  Array.from({ length: 10 }, (_, digit) =>
    getFormatter(locale, {
      useGrouping: false,
      maximumFractionDigits: 0,
    }).format(digit),
  );

const formatRawCurrency = ({
  raw,
  integerFormatter,
  decimalSeparator,
  localizedDigits,
  fractionDigits,
}: {
  raw: string;
  integerFormatter: Intl.NumberFormat;
  decimalSeparator: string;
  localizedDigits: string[];
  fractionDigits: number;
}) => {
  if (!raw) {
    return "";
  }

  if (fractionDigits === 0) {
    return integerFormatter.format(BigInt(raw));
  }

  const padded = raw.padStart(fractionDigits + 1, "0");
  const integerPart = padded.slice(0, -fractionDigits);
  const fractionPart = Array.from(
    padded.slice(-fractionDigits),
    (digit) => localizedDigits[digit.charCodeAt(0) - 48],
  ).join("");

  return `${integerFormatter.format(BigInt(integerPart))}${decimalSeparator}${fractionPart}`;
};

const DIGIT_CHAR_REGEX = /\p{N}/u;

const isDigitChar = (char: string | undefined) =>
  Boolean(char && DIGIT_CHAR_REGEX.test(char));

const removeDigitAt = (raw: string, index: number) =>
  raw.slice(0, index) + raw.slice(index + 1);

const getFormatter = (
  locale: Intl.LocalesArgument,
  options: Intl.NumberFormatOptions,
) => {
  const key = `${locale}-${JSON.stringify(options)}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat(locale, options));
  }
  return formatters.get(key)!;
};

export const useCurrencyMask = ({
  value,
  onChange,
  locale = "en-US",
  fractionDigits = 2,
}: {
  value: string | number;
  onChange: (raw: string) => void;
  locale?: string;
  fractionDigits?: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const integerFormatter = useMemo(
    () =>
      getFormatter(locale, {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const decimalSeparator = useMemo(
    () =>
      getFormatter(locale, {
        style: "decimal",
        useGrouping: false,
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
        .formatToParts(1.1)
        .find((part) => part.type === "decimal")?.value ?? ".",
    [locale],
  );
  const localizedDigits = useMemo(() => getLocalizedDigits(locale), [locale]);
  const formatCurrency = useCallback(
    (raw: string) =>
      formatRawCurrency({
        raw,
        integerFormatter,
        decimalSeparator,
        localizedDigits,
        fractionDigits,
      }),
    [decimalSeparator, fractionDigits, integerFormatter, localizedDigits],
  );

  useLayoutEffect(() => {
    if (!inputRef.current) return;
    const raw = normalizeRawValue(value, fractionDigits);
    const formatted = formatCurrency(raw);
    if (inputRef.current.value !== formatted) {
      inputRef.current.value = formatted;
    }
  }, [formatCurrency, fractionDigits, value]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;

      const rightRank = getRightDigitRankFromCursor(
        el.value,
        el.selectionStart || 0,
      );

      const raw = clampToSafeIntegerDigits(el.value);

      onChange(rawToDecimalValue(raw, fractionDigits));

      const formatted = formatCurrency(raw);
      el.value = formatted;

      const newPos = getCursorFromRightDigitRank(formatted, rightRank);
      el.setSelectionRange(newPos, newPos);
    },
    [formatCurrency, fractionDigits, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Backspace" && e.key !== "Delete") {
        return;
      }

      const el = e.currentTarget;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;

      if (start !== end) {
        return;
      }

      const charToDelete =
        e.key === "Backspace" ? el.value[start - 1] : el.value[start];

      if (isDigitChar(charToDelete)) {
        return;
      }

      const raw = clampToSafeIntegerDigits(el.value);
      if (!raw) {
        return;
      }

      const rightRank = getRightDigitRankFromCursor(el.value, start);
      const digitsToLeft = raw.length - rightRank;

      const deleteIndex =
        e.key === "Backspace" ? digitsToLeft - 1 : digitsToLeft;

      if (deleteIndex < 0 || deleteIndex >= raw.length) {
        return;
      }

      e.preventDefault();

      const nextRaw = removeDigitAt(raw, deleteIndex);
      onChange(rawToDecimalValue(nextRaw, fractionDigits));

      const formatted = formatCurrency(nextRaw);
      el.value = formatted;

      const nextRightRank =
        e.key === "Delete" ? Math.max(rightRank - 1, 0) : rightRank;

      const newPos = getCursorFromRightDigitRank(formatted, nextRightRank);
      el.setSelectionRange(newPos, newPos);
    },
    [formatCurrency, fractionDigits, onChange],
  );

  return {
    ref: inputRef,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    inputMode: "decimal" as const,
  };
};
