"use client";

import { isCompatibleSave } from "./monthEngine";
import { KEYS, readJson, storage, writeJson } from "./storageKeys";
import type { RunState } from "./types";

/**
 * The save, which lives in one browser and nowhere else.
 *
 * No account, no server, no recovery. That is a deliberate trade and it costs
 * something real: clearing browser data ends a run. The Help screen says so in those
 * words rather than letting somebody find out. What it buys is the sentence the whole
 * product rests on — nothing you type here reaches anybody.
 */

/** Shown when a save exists but this build cannot honestly load it. */
export const OUTDATED_SAVE_MESSAGE = "saves.outdated";

export type LoadResult =
  | { kind: "none" }
  | { kind: "run"; run: RunState }
  | { kind: "outdated" };

/**
 * Load, or refuse.
 *
 * A save from an older build is discarded rather than patched. Half-restoring a run
 * would mean showing somebody a cash figure that their decisions no longer explain,
 * and every figure in this product has to be derivable from what the player did.
 */
export function loadRunChecked(): LoadResult {
  if (!storage()) return { kind: "none" };
  const raw = readJson<unknown>(KEYS.save, null);
  if (raw === null) return { kind: "none" };
  if (!isCompatibleSave(raw)) return { kind: "outdated" };
  return { kind: "run", run: raw };
}

export function saveRun(run: RunState): void {
  writeJson(KEYS.save, run);
}

export function clearRun(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(KEYS.save);
  } catch {
    /* private mode — there was nothing to clear anyway */
  }
}
