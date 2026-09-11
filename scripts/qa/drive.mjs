// Scripted players, so the properties and the golden draws drive the engine the same way.
//
// A policy is a pair of pure functions over run state: which choice it takes on a card,
// and what it does with money before the month closes. Nothing here reaches into the
// engine's internals — a policy sees exactly what a person on the Month screen sees, so
// a property that passes under a policy is a statement about the game and not about
// the harness.
import { createRequire } from "module";
import { engineDir } from "./build-engine.mjs";

const OUT = engineDir();
const require = createRequire(`${OUT}/`);

export const lib = (m) => require(`${OUT}/lib/${m}.js`);

export const engine = lib("monthEngine");
export const cards = lib("cards");
export const personas = lib("personas");
export const stability = lib("stability");
export const costs = lib("costs");
export const debt = lib("debt");
export const income = lib("income");
export const mpf = lib("mpf");
export const facts = lib("facts");
export const helpLines = lib("helpLines");
export const concepts = lib("concepts");
export const replayLib = lib("replay");
export const report = lib("report");
export const rng = lib("rng");

export const PERSONA_IDS = personas.PERSONA_IDS;

/** Worst to best, so a property can say "no worse than". */
export const TIER_ORDER = ["trapped", "behind", "tight", "steady", "cushioned"];
export const tierRank = (tier) => TIER_ORDER.indexOf(tier);

/** Takes the safe option and puts everything spare aside. The habit the game teaches. */
export const careful = {
  name: "careful",
  pick: (open) => open.find((c) => c.kind === "primary") ?? open[0],
  money: (run) => {
    const spare = run.cash - 800;
    return spare > 0 ? engine.setAside(run, spare) : run;
  },
};

/** Takes the risky option every time and never sets anything aside. */
export const reckless = {
  name: "reckless",
  pick: (open) => open.find((c) => c.kind === "quiet") ?? open[open.length - 1],
  money: (run) => run,
};

/** Borrows its way through the year. Exercises the player-initiated loan path. */
export const borrower = {
  name: "borrower",
  pick: (open) => open.find((c) => c.kind === "quiet") ?? open[0],
  money: (run) => {
    if (run.cash >= 1200) return run;
    const result = engine.takeLoan(run, "licensed-lender", 2000);
    return result.refused ? run : result.run;
  },
};

/** Leaves everything that may be left, and pays down debt by hand when it can. */
export const deferrer = {
  name: "deferrer",
  pick: (open, card) => (card.deferrable ? null : (open.find((c) => c.kind === "primary") ?? open[0])),
  money: (run) => {
    const line = run.debts.find((d) => d.balance > 0);
    if (!line || run.cash < 1500) return run;
    return engine.repayDebt(run, line.id, 500);
  },
};

export const POLICIES = [careful, reckless, borrower, deferrer];

/**
 * Play a run to its end under a policy.
 *
 * `onMonth` is handed the run as it stood just before the month closed and the record
 * the close produced, which is the only place a property can see both sides of one
 * month's arithmetic.
 */
export function play(personaId, seed, policy, { months = 40, onMonth, weakSpots } = {}) {
  let run = engine.initRun(personaId, "", seed, weakSpots ? { weakSpots } : {});
  let guard = 0;

  while (run.status === "playing" && guard++ < months) {
    for (const card of engine.drawnCards(run)) {
      if (engine.isResolved(run, card.id)) continue;
      const open = cards.availableChoices(card, engine.cardContext(run));
      const choice = policy.pick(open, card, run);
      if (!choice) continue;
      const result = engine.applyChoice(run, card.id, choice.id);
      if (result) run = result.run;
    }
    if (policy.money) run = policy.money(run);
    const before = run;
    run = engine.advanceMonth(run);
    if (onMonth) onMonth(before, run, run.history[run.history.length - 1]);
  }

  return run;
}

/** Every (persona, seed) pair in a band, in a stable order. */
export function* cases(seeds, ids = PERSONA_IDS) {
  for (const personaId of ids) for (const seed of seeds) yield { personaId, seed };
}

export const range = (from, to) => Array.from({ length: to - from }, (_, i) => from + i);
