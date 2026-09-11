"use client";

import { CONCEPT_IDS } from "../concepts";
import { KEYS, readJson, writeJson } from "../storageKeys";
import type { ConceptId } from "../types";

/**
 * What this browser keeps getting wrong.
 *
 * Written at the end of a run and read at the start of the next, so a second year
 * draws more of what caught you in the first. It is the only thing in the product that
 * persists across runs, and it is deliberately small: a list of at most eight strings,
 * no history, no timestamps, no identifier.
 *
 * Nothing here is shown as a score. A player is never told they are bad at something —
 * the effect is only that the game asks about it again, which is what practice is.
 */

const MAX = CONCEPT_IDS.length;

function key(): string {
  return `${KEYS.weakSpots}v1`;
}

export function readWeakSpots(): ConceptId[] {
  const raw = readJson<unknown>(key(), []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is ConceptId => CONCEPT_IDS.includes(id as ConceptId)).slice(0, MAX);
}

/**
 * Merge a finished run's weak spots into what was already known.
 *
 * A union rather than a replacement: a concept you got wrong last year and never met
 * this year has not been learned, it has been avoided, and the next run should still
 * ask about it.
 */
export function recordWeakSpots(found: ConceptId[]): ConceptId[] {
  const merged = new Set([...readWeakSpots(), ...found]);
  const next = CONCEPT_IDS.filter((id) => merged.has(id));
  writeJson(key(), next);
  return next;
}

export function clearWeakSpots(): void {
  writeJson(key(), []);
}
