"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "ko" | "en";

const STORAGE_KEY = "dubbing-ai-locale";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
} | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ko");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(STORAGE_KEY);
    if (savedLocale === "ko" || savedLocale === "en") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
