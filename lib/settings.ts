"use client";

import { KEYS, readJson, writeJson } from "./storageKeys";
import { DEFAULT_LOCALE, isLocale } from "./i18n";
import type { Locale } from "./types";

export type Settings = { locale: Locale };

const FALLBACK: Settings = { locale: DEFAULT_LOCALE };

export function readSettings(): Settings {
  const raw = readJson<Partial<Settings>>(KEYS.settings, FALLBACK);
  return { locale: isLocale(raw.locale) ? raw.locale : DEFAULT_LOCALE };
}

export function writeSettings(next: Settings): void {
  writeJson(KEYS.settings, next);
}
