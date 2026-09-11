/**
 * Every localStorage key this product writes, named once.
 *
 * Month End has no accounts and no server: this list is the complete set of data
 * the game keeps about a person, and it never leaves their browser. The Help screen
 * says so in those words, so this file has to stay true to it.
 *
 * Clearing browser data clears a run. That is a real cost of having no accounts, and
 * the Help screen states it rather than letting a person discover it.
 */
export const KEYS = {
  /** The current run. Bumped with `RUN_VERSION` when the shape changes. */
  save: "monthend.save.v1",
  /** A random id for this browser, so progress is per-device without identifying anyone. */
  deviceId: "monthend.deviceId",
  /** Locale and reduced-motion preference. */
  settings: "monthend.settings",
  /** Prefixes, completed with the device id. */
  weakSpots: "monthend.weakSpots.",
  mastery: "monthend.mastery.",
  /** Concepts this browser has met at least once. */
  seenConcepts: "monthend.seenConcepts",
  /** Glossary terms opened during runs, listed on the report. */
  seenTerms: "monthend.seenTerms",
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

/** localStorage throws in private modes and when storage is disabled. Never let it take the page down. */
export function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — a lost save is better than a lost page */
  }
}
