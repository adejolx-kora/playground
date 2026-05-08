import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

import {
  getCursorFromRightDigitRank,
  getRightDigitRankFromCursor,
  stripDigits,
} from "@/lib/utils";

type CardType = "amex" | "visa" | "mastercard" | "maestro" | "unknown";

type UseCardMaskArgs = {
  value: string;
  onChange: (raw: string) => void;
};

type CardMaskMeta = {
  cardType: CardType;
  maxDigits: number;
  isComplete: boolean;
  isValid: boolean;
};

const getCardType = (digits: string): CardType => {
  if (/^3[47]/.test(digits)) return "amex";
  if (/^4/.test(digits)) return "visa";

  // MasterCard: 51-55 or 2221-2720
  if (
    /^(5[1-5])/.test(digits) ||
    /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)
  ) {
    return "mastercard";
  }

  // Maestro commonly uses prefixes in 50/56-69 ranges and can be up to 19 digits.
  if (/^(50|5[6-9]|6\d)/.test(digits)) return "maestro";

  return "unknown";
};

const getMaxDigits = (cardType: CardType) => {
  if (cardType === "amex") return 15;
  if (cardType === "maestro") return 19;
  return 16;
};

const formatCardNumber = (digits: string, cardType: CardType) => {
  if (!digits) return "";

  if (cardType === "amex") {
    const g1 = digits.slice(0, 4);
    const g2 = digits.slice(4, 10);
    const g3 = digits.slice(10, 15);

    return [g1, g2, g3].filter(Boolean).join(" ");
  }

  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
};

const luhnCheck = (digits: string) => {
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);

    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }

    sum += d;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const useCardMask = ({ value, onChange }: UseCardMaskArgs) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = useMemo<CardMaskMeta>(() => {
    const digits = stripDigits(value);
    const cardType = getCardType(digits);
    const maxDigits = getMaxDigits(cardType);
    const boundedDigits = digits.slice(0, maxDigits);
    const isComplete = boundedDigits.length === maxDigits;

    return {
      cardType,
      maxDigits,
      isComplete,
      isValid: isComplete && luhnCheck(boundedDigits),
    };
  }, [value]);

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    const digits = stripDigits(value).slice(0, meta.maxDigits);
    const formatted = formatCardNumber(digits, meta.cardType);

    if (inputRef.current.value !== formatted) {
      inputRef.current.value = formatted;
    }
  }, [meta.cardType, meta.maxDigits, value]);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();

      const pastedDigits = stripDigits(e.clipboardData.getData("text"));
      const pastedType = getCardType(pastedDigits);
      const maxDigits = getMaxDigits(pastedType);

      onChange(pastedDigits.slice(0, maxDigits));
    },
    [onChange],
  );

  const onInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const rightRank = getRightDigitRankFromCursor(
        el.value,
        el.selectionStart || 0,
      );

      const nextDigits = stripDigits(el.value);
      const nextType = getCardType(nextDigits);
      const maxDigits = getMaxDigits(nextType);
      const bounded = nextDigits.slice(0, maxDigits);

      onChange(bounded);

      const formatted = formatCardNumber(bounded, nextType);
      el.value = formatted;

      const newPos = getCursorFromRightDigitRank(formatted, rightRank);
      el.setSelectionRange(newPos, newPos);
    },
    [onChange],
  );

  return {
    ref: inputRef,
    onInput,
    onPaste,
    inputMode: "numeric" as const,
    autoComplete: "cc-number",
    ...meta,
  };
};
