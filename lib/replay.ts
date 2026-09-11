import { getCard } from "./cards";
import { PERSONA_IDS } from "./personas";
import { PLAYER_LOAN_KINDS } from "./debt";
import type { PlayerLoanKind } from "./debt";
import {
  advanceMonth,
  applyChoice,
  initRun,
  quitRun,
  repayDebt,
  setAside,
  takeLoan,
} from "./monthEngine";
import type { ConceptId, EndReason, MonthJournal, PersonaId, RunState } from "./types";

/**
 * A run, rebuilt from what the player did.
 *
 * This exists for one reason: a final statement that tells somebody a trap cost them
 * HK$ 3,400 has to be derivable from their own decisions, not from a number the app
 * happened to be holding. If the journal cannot reproduce the run, the report is a
 * claim rather than a record — and this audience is the last group that should be
 * asked to take a number on trust.
 *
 * It is also the share ticket: persona plus seed is enough for somebody else to meet
 * the same twelve months and find out what they would have done.
 */

export type ReplayHeader = {
  seed: number;
  personaId: PersonaId;
  name: string;
  /** Draw weighting from earlier runs. Omitted, the draw is a first-time player's draw. */
  weakSpots?: ConceptId[];
  /** Only "quit" matters here: the other two endings fall out of the journal itself. */
  endReason?: EndReason;
};

export function replayHeader(run: RunState): ReplayHeader {
  return {
    seed: run.seed,
    personaId: run.personaId,
    name: run.name,
    weakSpots: run.weakSpots,
    endReason: run.endReason,
  };
}

export type ReplayResult = {
  run: RunState;
  ok: boolean;
  /** Where the journal stopped describing a run this engine can produce. */
  diverged?: string;
};

function isPlayerLoanKind(kind: string): kind is PlayerLoanKind {
  return (PLAYER_LOAN_KINDS as readonly string[]).includes(kind);
}

/**
 * Replay a journal.
 *
 * Every act is re-applied through the same functions that produced it — never through
 * a shortcut that sets the numbers directly. A replay that wrote the answers in would
 * pass its own test and prove nothing.
 */
export function replay(header: ReplayHeader, journal: MonthJournal[]): ReplayResult {
  let run = initRun(header.personaId, header.name, header.seed, { weakSpots: header.weakSpots });

  const stop = (why: string): ReplayResult => ({ run, ok: false, diverged: why });

  for (const entry of journal) {
    if (run.status === "ended") return stop(`month ${entry.m}: the run had already ended`);
    if (entry.m !== run.month) return stop(`expected month ${run.month}, journal says ${entry.m}`);

    for (const act of entry.acts) {
      switch (act[0]) {
        case "c": {
          const [, cardId, choiceId, outcomeIdx] = act;
          if (!getCard(cardId)) return stop(`month ${entry.m}: no card "${cardId}" in this build`);
          const result = applyChoice(run, cardId, choiceId);
          if (!result) return stop(`month ${entry.m}: could not take "${choiceId}" on "${cardId}"`);
          if (result.index !== outcomeIdx) {
            return stop(
              `month ${entry.m}: "${cardId}:${choiceId}" rolled outcome ${result.index}, journal says ${outcomeIdx}`,
            );
          }
          run = result.run;
          break;
        }
        case "b": {
          const [, kind, amount] = act;
          if (!isPlayerLoanKind(kind)) {
            return stop(`month ${entry.m}: "${kind}" is not a loan a player can take`);
          }
          const result = takeLoan(run, kind, amount);
          if (result.refused) return stop(`month ${entry.m}: loan refused (${result.refused})`);
          run = result.run;
          break;
        }
        case "r": {
          const [, debtId, amount] = act;
          const before = run.cash;
          run = repayDebt(run, debtId, amount);
          if (run.cash !== before - amount) {
            return stop(`month ${entry.m}: repaying ${amount} on "${debtId}" moved a different amount`);
          }
          break;
        }
        case "s": {
          const [, amount] = act;
          const before = run.savings;
          run = setAside(run, amount);
          if (run.savings !== before + amount) {
            return stop(`month ${entry.m}: setting aside ${amount} moved a different amount`);
          }
          break;
        }
        case "d":
          // Written by `advanceMonth`, not by the player. Re-applying it would defer a
          // card twice; the close below records it again on its own.
          break;
      }
    }

    if (entry.end) run = advanceMonth(run);
  }

  if (header.endReason === "quit" && run.status === "playing") run = quitRun(run);

  return { run, ok: true };
}

/** Replay a run from itself. The identity this whole file exists to guarantee. */
export function replayOf(run: RunState): ReplayResult {
  return replay(replayHeader(run), run.journal);
}

// ── The share ticket ────────────────────────────────────────────────────────
/**
 * `monthend:mdw:1234567` — the smallest thing that hands somebody the same year.
 *
 * Deliberately not the journal. A ticket is something a person pastes into WhatsApp,
 * and it carries no name, no figures and nothing about how the run went.
 */
export function ticket(run: RunState): string {
  return `monthend:${run.personaId}:${run.seed >>> 0}`;
}

export function parseTicket(value: string): { personaId: PersonaId; seed: number } | null {
  const parts = value.trim().toLowerCase().split(":");
  if (parts.length !== 3 || parts[0] !== "monthend") return null;
  const [, personaId, rawSeed] = parts;
  if (!(PERSONA_IDS as readonly string[]).includes(personaId)) return null;
  if (!/^\d+$/.test(rawSeed)) return null;
  const seed = Number(rawSeed);
  if (!Number.isSafeInteger(seed)) return null;
  return { personaId: personaId as PersonaId, seed: seed | 0 };
}
