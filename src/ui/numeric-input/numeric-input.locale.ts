/** Locale-aware parsing and formatting helpers for numeric drafts. */

import { isParseableNumericDraft, sanitizeNumericDraft } from "./numeric-input.math";
import type { Direction, LocaleParts } from "./numeric-input.types";

const localePartsCache = new Map<string, LocaleParts>();
const latinLocaleCache = new Map<string, string>();
const numberFormatterCache = new Map<string, Intl.NumberFormat>();

/** Returns a cached Latin-digit locale variant for formatting and parsing. */
function getCachedLatinLocale(locale: string) {
  const cached = latinLocaleCache.get(locale);
  if (cached) {
    return cached;
  }

  const resolved = toLatinDigitLocale(locale);
  latinLocaleCache.set(locale, resolved);
  return resolved;
}

/** Returns a cached formatter for a locale and fraction-digit pair. */
function getCachedNumberFormatter(
  locale: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
) {
  const cacheKey = `${locale}__${minimumFractionDigits}__${maximumFractionDigits}`;
  const cached = numberFormatterCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(getCachedLatinLocale(locale), {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  numberFormatterCache.set(cacheKey, formatter);
  return formatter;
}

/** Returns the browser's preferred locale, with `"en-US"` as fallback. */
export function getBrowserLocale(): string {
  if (typeof navigator === "undefined") return "en-US";
  return navigator.languages?.[0] ?? navigator.language ?? "en-US";
}

/** Resolves a supported locale string with browser fallback semantics. */
export function getResolvedLocale(locale?: Intl.LocalesArgument): string {
  const fallback = getBrowserLocale();

  if (locale === undefined) {
    return fallback;
  }

  try {
    const supportedLocales = Intl.NumberFormat.supportedLocalesOf(locale);
    return supportedLocales[0] ?? fallback;
  } catch {
    return fallback;
  }
}

/** Returns the current document direction, defaulting to `"ltr"` on the server. */
export function getBrowserDirection(): Direction {
  if (typeof document === "undefined") return "ltr";
  return document.documentElement.dir === "rtl" ? "rtl" : "ltr";
}

/** Resolves the explicit direction override or the current document direction. */
export function getResolvedDirection(dir?: Direction): Direction {
  return dir ?? getBrowserDirection();
}

/** Infers layout direction from the locale's base language tag. */
export function getDirectionFromLocale(locale: string): Direction {
  const normalized = locale.trim().toLowerCase().replace(/_/g, "-");
  const language = normalized.split("-")[0];
  const rtlLanguages = new Set(["ar", "fa", "he", "ur"]);

  return rtlLanguages.has(language) ? "rtl" : "ltr";
}

/** Adds the `latn` numbering-system extension to a locale when supported. */
export function toLatinDigitLocale(locale: string): string {
  try {
    return new Intl.Locale(locale, { numberingSystem: "latn" }).toString();
  } catch {
    return locale;
  }
}

/** Collects locale-specific separators and digits used by the parser. */
export function getNumberLocaleParts(locale: string): LocaleParts {
  const cached = localePartsCache.get(locale);
  if (cached) {
    return cached;
  }

  const latinLocale = getCachedLatinLocale(locale);
  const parts = new Intl.NumberFormat(latinLocale).formatToParts(-1000.1);
  const localizedParts = new Intl.NumberFormat(locale).formatToParts(-1000.1);
  let decimal = ".";
  let group = ",";
  let minusSign = "-";
  for (const part of parts) {
    if (part.type === "decimal") decimal = part.value;
    else if (part.type === "group") group = part.value;
    else if (part.type === "minusSign") minusSign = part.value;
  }

  const decimalSeparators = new Set([decimal]);
  const groupSeparators = new Set([group]);
  const minusSigns = new Set([minusSign, "-"]);

  for (const part of localizedParts) {
    if (part.type === "decimal") decimalSeparators.add(part.value);
    else if (part.type === "group") groupSeparators.add(part.value);
    else if (part.type === "minusSign") minusSigns.add(part.value);
  }

  const digits = new Map<string, string>();
  const localeDigitFormatter = new Intl.NumberFormat(locale, { useGrouping: false });
  const latinDigitFormatter = new Intl.NumberFormat(latinLocale, {
    useGrouping: false,
  });

  for (let digit = 0; digit <= 9; digit += 1) {
    digits.set(localeDigitFormatter.format(digit), latinDigitFormatter.format(digit));
  }

  const localeParts = {
    decimal,
    group,
    minusSign,
    digits,
    decimalSeparators: Array.from(decimalSeparators),
    groupSeparators: Array.from(groupSeparators),
    minusSigns: Array.from(minusSigns),
  };

  localePartsCache.set(locale, localeParts);
  return localeParts;
}

/** Parses a localized draft into the normalized internal draft format. */
export function parseLocalizedDraftToNormalized(
  input: string,
  localeParts: LocaleParts,
): string {
  const {
    decimal,
    digits,
    decimalSeparators,
    groupSeparators,
    minusSigns,
  } = localeParts;
  let normalized = input;
  for (const [localeDigit, asciiDigit] of digits) {
    if (localeDigit !== asciiDigit) {
      normalized = normalized.split(localeDigit).join(asciiDigit);
    }
  }
  for (const candidate of minusSigns) {
    if (candidate !== "-") {
      normalized = normalized.split(candidate).join("-");
    }
  }
  for (const candidate of groupSeparators) {
    if (candidate) {
      normalized = normalized.split(candidate).join("");
    }
  }
  for (const candidate of decimalSeparators) {
    if (candidate !== decimal) {
      normalized = normalized.split(candidate).join(decimal);
    }
  }
  if (decimal !== ".") {
    normalized = normalized.split(decimal).join(".");
  }
  return sanitizeNumericDraft(normalized);
}

/** Returns the visible fractional precision to preserve during formatting. */
export function getVisibleFractionDigitsForScale(
  value: string,
  maxScale: number,
): number {
  const dotIndex = value.indexOf(".");
  if (dotIndex === -1) {
    return 0;
  }
  return Math.min(value.length - dotIndex - 1, maxScale);
}

/** Returns `true` when formatting through `Number` would lose precision. */
function isUnsafeForNumberDisplay(value: string): boolean {
  if (!value || !isParseableNumericDraft(value)) {
    return false;
  }

  const isNegative = value.startsWith("-");
  const unsigned = value.substring(isNegative ? 1 : 0);
  const dotIndex = unsigned.indexOf(".");
  const integerPartStr = dotIndex === -1 ? unsigned : unsigned.substring(0, dotIndex);
  const fractionalPartStr = dotIndex === -1 ? "" : unsigned.substring(dotIndex + 1);

  if (!integerPartStr) {
    return false;
  }

  try {
    const integerBigInt = BigInt(integerPartStr);
    const maxSafeAsBigInt = BigInt(Number.MAX_SAFE_INTEGER);

    if (integerBigInt > maxSafeAsBigInt) {
      return true;
    }

    if (integerBigInt === maxSafeAsBigInt && fractionalPartStr) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Formats a normalized draft for display.
 *
 * Values outside the safe `Number` range are returned unchanged so display
 * formatting never silently rounds the user's data.
 */
export function formatNormalizedToLocalizedDisplay(
  value: string,
  locale: string,
  scale: number,
): string {
  if (!value || !isParseableNumericDraft(value)) {
    return value;
  }

  // Check for unsafe display values BEFORE Number conversion to avoid precision loss
  if (isUnsafeForNumberDisplay(value)) {
    return value;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;

  const fractionDigits = getVisibleFractionDigitsForScale(value, scale);

  return getCachedNumberFormatter(
    locale,
    fractionDigits,
    Math.max(fractionDigits, scale),
  ).format(numericValue);
}
