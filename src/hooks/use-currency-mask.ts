import { useLayoutEffect, useRef, useCallback, useMemo } from "react";

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

const strip = (val: string) => val.replace(/\D/g, "");

const getCursorFromRightRank = (val: string, rightRank: number) => {
  let digitCount = 0;
  for (let i = val.length - 1; i >= 0; i--) {
    if (digitCount === rightRank) return i + 1;
    if (/\d/.test(val[i])) digitCount++;
  }
  return 0;
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

      const rightRank = strip(el.value.slice(el.selectionStart || 0)).length;

      const raw = strip(el.value);

      onChange(raw);

      const formatted = raw ? formatter.format(Number(raw) / 100) : "";
      el.value = formatted;

      const newPos = getCursorFromRightRank(formatted, rightRank);
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
