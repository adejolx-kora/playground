import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

import {
  getCursorFromRightDigitRank,
  getRightDigitRankFromCursor,
  stripDigits,
} from "@/lib/utils";

type UseCvvMaskArgs = {
  value: string;
  onChange: (raw: string) => void;
  length?: 3 | 4;
  masked?: boolean;
};

export const useCvvMask = ({
  value,
  onChange,
  length = 3,
  masked = true,
}: UseCvvMaskArgs) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedValue = useMemo(
    () => stripDigits(value).slice(0, length),
    [length, value],
  );

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    if (inputRef.current.value !== normalizedValue) {
      inputRef.current.value = normalizedValue;
    }
  }, [normalizedValue]);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      onChange(stripDigits(e.clipboardData.getData("text")).slice(0, length));
    },
    [length, onChange],
  );

  const onInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const rightRank = getRightDigitRankFromCursor(
        el.value,
        el.selectionStart || 0,
      );

      const next = stripDigits(el.value).slice(0, length);
      onChange(next);

      el.value = next;

      const newPos = getCursorFromRightDigitRank(next, rightRank);
      el.setSelectionRange(newPos, newPos);
    },
    [length, onChange],
  );

  return {
    ref: inputRef,
    onInput,
    onPaste,
    inputMode: "numeric" as const,
    autoComplete: "cc-csc",
    maxLength: length,
    type: masked ? ("password" as const) : ("text" as const),
    isComplete: normalizedValue.length === length,
    isValid: normalizedValue.length === length,
  };
};
