import { useLayoutEffect, useRef, useCallback, useMemo } from "react";

import {
  getCursorFromRightDigitRank,
  getRightDigitRankFromCursor,
  stripDigits,
} from "@/lib/utils";

const formatters = new Map();

const getFormatter = (
  locale: Intl.LocalesArgument,
  options: Intl.NumberFormatOptions,
) => {
  const key = `${locale}-${JSON.stringify(options)}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat(locale, options));
  }
  return formatters.get(key);
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
  const formatter = useMemo(
    () =>
      getFormatter(locale, {
        style: "decimal",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    [locale, fractionDigits],
  );

  useLayoutEffect(() => {
    if (!inputRef.current) return;
    const formatted = value ? formatter.format(Number(value) / 100) : "";
    if (inputRef.current.value !== formatted) {
      inputRef.current.value = formatted;
    }
  }, [value, formatter]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;

      const rightRank = getRightDigitRankFromCursor(
        el.value,
        el.selectionStart || 0,
      );

      const raw = stripDigits(el.value);

      onChange(raw);

      const formatted = raw ? formatter.format(Number(raw) / 100) : "";
      el.value = formatted;

      const newPos = getCursorFromRightDigitRank(formatted, rightRank);
      el.setSelectionRange(newPos, newPos);
    },
    [onChange, formatter],
  );

  return {
    ref: inputRef,
    onInput: handleInput,
    inputMode: "decimal" as const,
  };
};
