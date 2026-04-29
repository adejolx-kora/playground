import { useCallback, useLayoutEffect, useRef } from "react";

const getRightDigitRank = (val: string, cursor: number) =>
  strip(val.slice(cursor)).length;

const getCursorFromRightRank = (val: string, rightRank: number) => {
  let digitCount = 0;
  for (let i = val.length - 1; i >= 0; i--) {
    if (digitCount === rightRank) return i + 1;
    if (/\d/.test(val[i])) digitCount++;
  }
  return 0;
};

const strip = (val: string) => val.replace(/[^\d+]/g, "");

const cleanPaste = (val: string) => {
  const noZero = val.replace(/\(0\)/g, "");
  return strip(noZero);
};

const applyMask = (raw: string, pattern: string) => {
  if (!raw) return "";
  let result = "";
  let rawIdx = 0;

  for (let i = 0; i < pattern.length && rawIdx < raw.length; i++) {
    const pChar = pattern[i];
    const rChar = raw[rawIdx];

    if (pChar === "#") {
      result += rChar;
      rawIdx++;
    } else {
      result += pChar;
      if (rChar === pChar) rawIdx++;
    }
  }
  return result + raw.slice(rawIdx);
};

export const usePhoneMask = ({
  value,
  onChange,
  pattern = "(###) ### #### ###",
}: {
  value: string;
  onChange: (raw: string) => void;
  pattern?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const firstEditableIndex = pattern.indexOf("#");

  useLayoutEffect(() => {
    if (!inputRef.current) return;
    const formatted = applyMask(value, pattern);
    if (inputRef.current.value !== formatted) {
      inputRef.current.value = formatted;
    }
  }, [value, pattern]);

  const onSelect = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const { selectionStart, selectionEnd } = el;

      if (selectionStart === selectionEnd) {
        if ((selectionStart ?? 0) < firstEditableIndex) {
          el.setSelectionRange(firstEditableIndex, firstEditableIndex);
        }
      }
    },
    [firstEditableIndex],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");
      const cleaned = cleanPaste(pastedData);
      onChange(cleaned);
    },
    [onChange],
  );

  const onInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const rightRank = getRightDigitRank(el.value, el.selectionStart || 0);

      const raw = strip(el.value);
      onChange(raw);

      const formatted = applyMask(raw, pattern);
      el.value = formatted;

      const newPos = getCursorFromRightRank(formatted, rightRank);
      el.setSelectionRange(newPos, newPos);
    },
    [onChange, pattern],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const el = e.currentTarget;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (el.selectionStart === firstEditableIndex) {
          e.preventDefault();
          return;
        }
      }

      if (e.key === "Backspace" && el.selectionStart === el.selectionEnd) {
        const pos = el.selectionStart || 0;

        if (pos <= firstEditableIndex) {
          e.preventDefault();
          return;
        }

        const charBefore = el.value[pos - 1];
        if (charBefore && /\D/.test(charBefore)) {
          e.preventDefault();
          const jumpPos = pos - 1;
          el.setSelectionRange(jumpPos, jumpPos);
          const newValue =
            el.value.slice(0, jumpPos - 1) + el.value.slice(jumpPos);
          onChange(strip(newValue));
        }
      }
    },
    [onChange, firstEditableIndex],
  );

  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      if ((el.selectionStart ?? 0) < firstEditableIndex) {
        el.setSelectionRange(firstEditableIndex, firstEditableIndex);
      }
    },
    [firstEditableIndex],
  );

  return {
    ref: inputRef,
    onInput,
    onKeyDown,
    onSelect,
    onPaste,
    onFocus,
    inputMode: "tel" as const,
    autoComplete: "tel",
  };
};
