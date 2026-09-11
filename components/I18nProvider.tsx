"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, EN, loadMessages, plural, translate, type Messages } from "@/lib/i18n";
import { readSettings, writeSettings } from "@/lib/settings";
import type { Locale } from "@/lib/types";

type I18n = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tn: (key: string, count: number, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

/**
 * The default context is English with the bundled catalogue, so a component rendered
 * outside the provider still renders words rather than keys.
 */
const Ctx = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  t: (key, vars) => translate(EN, key, vars),
  tn: (key, count, vars) => plural(EN, DEFAULT_LOCALE, key, count, vars),
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages>(EN);

  // The stored preference is read after mount, not during render: the first paint is
  // server-rendered English, and reading localStorage during render would make the
  // markup disagree with itself.
  useEffect(() => {
    const stored = readSettings().locale;
    if (stored !== DEFAULT_LOCALE) setLocaleState(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMessages(locale).then((m) => {
      if (!cancelled) setMessages(m);
    });
    document.documentElement.lang = locale;
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeSettings({ locale: next });
  }, []);

  const value = useMemo<I18n>(
    () => ({
      locale,
      t: (key, vars) => translate(messages, key, vars),
      tn: (key, count, vars) => plural(messages, locale, key, count, vars),
      setLocale,
    }),
    [locale, messages, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  return useContext(Ctx);
}
