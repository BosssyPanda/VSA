import type { Locale } from "./types";
import en from "@/messages/en.json";
import status from "@/messages/status.json";

/**
 * Translation, without a library.
 *
 * An ICU runtime is ~10 kB gzipped and would buy two things this product does not
 * need: date/number formatting (already handled by `Intl` in `lib/format.ts`) and
 * nested select logic (no string here needs it). What is left is interpolation and
 * plurals, and `Intl.PluralRules` is in every browser this audience uses.
 *
 * The rule that matters more than any of this: a missing key falls back to English
 * rather than rendering a key name. Somebody deciding about a loan should never be
 * shown `card.why` where a sentence belongs.
 */
export type Messages = Record<string, string>;

export const EN = en as Messages;

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Every locale, with its name written the way its own readers write it.
 * `ready` comes from `messages/status.json`, which `npm run qa:messages` regenerates
 * and fails on if it is stale — so an incomplete locale cannot quietly reach the picker.
 */
export const LOCALES: ReadonlyArray<{ id: Locale; label: string; ready: boolean }> = [
  { id: "en", label: "English", ready: true },
  { id: "tl", label: "Tagalog", ready: Boolean(status.tl?.complete) },
  { id: "id", label: "Bahasa Indonesia", ready: Boolean(status.id?.complete) },
];

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((l) => l.id === value);
}

/** The locales a player may actually choose. */
export function readyLocales() {
  return LOCALES.filter((l) => l.ready);
}

/**
 * Load a locale's strings.
 *
 * English is bundled; everything else is fetched on demand, so a first load on a
 * cheap phone carries one language rather than three.
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === "en") return EN;
  try {
    const mod = await import(`@/messages/${locale}.json`);
    return (mod.default ?? mod) as Messages;
  } catch {
    return EN;
  }
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

/**
 * One string. Falls back to English, then to the key itself — and a key reaching the
 * screen is a bug `qa:messages` is meant to catch before a player ever sees it.
 */
export function translate(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const template = messages[key] ?? EN[key] ?? key;
  return interpolate(template, vars);
}

/**
 * A counted string. Keys are written `key.one` / `key.other`; other plural categories
 * (`few`, `many`) are looked up first, so a language that needs them only needs the
 * extra keys, not a code change.
 */
export function plural(
  messages: Messages,
  locale: Locale,
  key: string,
  count: number,
  vars?: Record<string, string | number>,
): string {
  const category = new Intl.PluralRules(locale === "en" ? "en" : locale).select(count);
  const candidates = [`${key}.${category}`, `${key}.other`, key];
  const found = candidates.find((k) => messages[k] ?? EN[k]);
  return translate(messages, found ?? key, { ...vars, count });
}
