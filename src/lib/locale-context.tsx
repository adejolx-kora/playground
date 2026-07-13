/* eslint-disable react-refresh/only-export-components */

import * as React from "react";

export type AppLocale = "en" | "fr" | "zh" | "ar";

const STORAGE_KEY = "korapay.locale";

export const supportedLocales = [
  "en",
  "fr",
  "zh",
  "ar",
] as const satisfies ReadonlyArray<AppLocale>;

export const APP_LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  fr: "French",
  zh: "Chinese",
  ar: "Arabic",
};

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  supportedLocales: ReadonlyArray<AppLocale>;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    (supportedLocales as ReadonlyArray<string>).includes(value)
  );
}

function mapLocaleToAppLocale(locale: string): AppLocale | undefined {
  const normalized = locale.trim().toLowerCase().replace(/_/g, "-");
  const base = normalized.split("-")[0];

  if (base === "en") return "en";
  if (base === "fr") return "fr";
  if (base === "zh") return "zh";
  if (base === "ar") return "ar";

  return undefined;
}

function getStoredLocale(): AppLocale | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    if (!storedLocale) {
      return undefined;
    }

    if (isAppLocale(storedLocale)) {
      return storedLocale;
    }

    return mapLocaleToAppLocale(storedLocale);
  } catch {
    return undefined;
  }
}

function getBrowserLocale(): AppLocale | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const localeCandidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);

  for (const candidate of localeCandidates) {
    const mapped = mapLocaleToAppLocale(candidate);
    if (mapped) {
      return mapped;
    }
  }

  return undefined;
}

function getInitialLocale(): AppLocale {
  return getStoredLocale() ?? getBrowserLocale() ?? "en";
}

function getDocumentDirection(locale: AppLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function AppLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<AppLocale>(() =>
    getInitialLocale(),
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }, [locale]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.lang = locale;
    root.dir = getDocumentDirection(locale);
  }, [locale]);

  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      supportedLocales,
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export const LocaleProvider = AppLocaleProvider;

export function useLocale() {
  const context = React.useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within an AppLocaleProvider.");
  }

  return context;
}
