import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const borderWidthScale = ["xs", "sm", "md", "lg", "xl", "2xl"];
const spacingScale = [
  "0",
  "7xs",
  "6xs",
  "5xs",
  "4xs",
  "3xs",
  "2xs",
  "1xs",
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
];
const marginScale = ["auto", ...spacingScale];

const twMerge = extendTailwindMerge({
  prefix: "kora",
  extend: {
    classGroups: {
      "border-w": [
        { border: borderWidthScale },
        { "border-x": borderWidthScale },
        { "border-y": borderWidthScale },
        { "border-t": borderWidthScale },
        { "border-r": borderWidthScale },
        { "border-b": borderWidthScale },
        { "border-l": borderWidthScale },
        { "border-s": borderWidthScale },
        { "border-e": borderWidthScale },
      ],
      p: [{ p: spacingScale }],
      px: [{ px: spacingScale }],
      py: [{ py: spacingScale }],
      ps: [{ ps: spacingScale }],
      pe: [{ pe: spacingScale }],
      pbs: [{ pbs: spacingScale }],
      pbe: [{ pbe: spacingScale }],
      pt: [{ pt: spacingScale }],
      pr: [{ pr: spacingScale }],
      pb: [{ pb: spacingScale }],
      pl: [{ pl: spacingScale }],
      m: [{ m: marginScale }],
      mx: [{ mx: marginScale }],
      my: [{ my: marginScale }],
      ms: [{ ms: marginScale }],
      me: [{ me: marginScale }],
      mbs: [{ mbs: marginScale }],
      mbe: [{ mbe: marginScale }],
      mt: [{ mt: marginScale }],
      mr: [{ mr: marginScale }],
      mb: [{ mb: marginScale }],
      ml: [{ ml: marginScale }],
      gap: [{ gap: spacingScale }],
      "gap-x": [{ "gap-x": spacingScale }],
      "gap-y": [{ "gap-y": spacingScale }],
      "font-size": [
        {
          text: [
            "subheading-md",
            "subheading-sm",
            "subheading-xs",
            "subheading-2xs",
            "title-1",
            "title-2",
            "title-3",
            "title-4",
            "title-5",
            "label-xl",
            "label-lg",
            "label-md",
            "label-sm",
            "label-xs",
            "body-xl",
            "body-lg",
            "body-md",
            "body-sm",
            "body-xs",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function getRightDigitRankFromCursor(value: string, cursor: number) {
  return stripDigits(value.slice(cursor)).length;
}

export function getCursorFromRightDigitRank(value: string, rightRank: number) {
  let digitCount = 0;

  for (let i = value.length - 1; i >= 0; i--) {
    if (digitCount === rightRank) return i + 1;
    if (/\d/.test(value[i])) digitCount++;
  }

  return 0;
}

type NumberFormatInput = number | bigint | null | undefined;

export function formatNumber(
  value: NumberFormatInput,
  options: Intl.NumberFormatOptions = {},
  locale: string | string[] = "en-US",
  fallback = "",
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return fallback;
  }

  return new Intl.NumberFormat(locale, options).format(value);
}
