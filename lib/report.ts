import { getCard, isTrap } from "./cards";
import { CONCEPT_IDS, concept } from "./concepts";
import { cushionMonths } from "./costs";
import { debtTotal } from "./debt";
import { HELP_LINES, helpLine } from "./helpLines";
import { getPersona } from "./personas";
import { deriveVerdict } from "./stability";
import type {
  Card,
  Concept,
  ConceptId,
  HelpLine,
  Outcome,
  RunState,
  TellId,
  Verdict,
} from "./types";

/**
 * What a run hands back.
 *
 * The final statement is the product. Twelve months of decisions are worth nothing if
 * a player walks away with a feeling instead of something they can repeat, so
 * everything here is derived from what they actually did — no figure on that screen is
 * allowed to come from anywhere but the journal.
 *
 * The framing is fixed: what the traps took, what protected you, three rules. Never a
 * score, never a grade, never a comparison with anybody else.
 */

export type PlayedCard = {
  month: number;
  card: Card;
  choiceId: string;
  outcome: Outcome;
};

/**
 * Every card the player answered, in the order they answered them.
 *
 * Read from the journal rather than from `run.resolved`, because the journal keeps the
 * order and the month and the resolved map keeps neither — and "what did this cost me,
 * and when" is most of what the report is for.
 */
export function playedCards(run: RunState): PlayedCard[] {
  const out: PlayedCard[] = [];
  for (const entry of run.journal) {
    for (const act of entry.acts) {
      if (act[0] !== "c") continue;
      const [, cardId, choiceId, outcomeIdx] = act;
      const card = getCard(cardId);
      if (!card) continue;
      const choice = card.choices.find((c) => c.id === choiceId);
      const outcome = choice?.outcomes[outcomeIdx];
      if (!outcome) continue;
      out.push({ month: entry.m, card, choiceId, outcome });
    }
  }
  return out;
}

// ── What the traps took ─────────────────────────────────────────────────────
export type TrapHit = {
  month: number;
  cardId: string;
  title: string;
  /** Cash and cushion that left the player's hands. */
  moneyOut: number;
  /** What was borrowed. Counted at the amount borrowed; the interest is its own line. */
  debtTaken: number;
  tells: TellId[];
  concepts: ConceptId[];
};

function moneyOut(outcome: Outcome): number {
  const cash = Math.max(0, -(outcome.effect.cash ?? 0));
  const savings = Math.max(0, -(outcome.effect.savings ?? 0));
  return cash + savings;
}

/** Trap cards where the trap won. */
export function trapHits(run: RunState): TrapHit[] {
  return playedCards(run)
    .filter((p) => isTrap(p.card) && !p.outcome.applied)
    .map((p) => ({
      month: p.month,
      cardId: p.card.id,
      title: p.card.title,
      moneyOut: moneyOut(p.outcome),
      debtTaken: p.outcome.effect.addDebt?.balance ?? 0,
      tells: p.outcome.tells ?? p.card.pitch?.tells ?? [],
      concepts: p.outcome.concepts,
    }));
}

/** Trap cards where the player saw it coming. */
export function trapsSpotted(run: RunState): PlayedCard[] {
  return playedCards(run).filter((p) => isTrap(p.card) && p.outcome.applied);
}

/**
 * What the traps took, in HK$.
 *
 * Money that left, plus what was borrowed at the amount borrowed. The interest that
 * borrowing then charged is reported on its own line rather than folded in here,
 * because a single big number explains nothing and the two halves teach different
 * things: one is what the trap asked for, the other is what it kept asking for.
 */
export function trapCost(run: RunState): number {
  return trapHits(run).reduce((total, hit) => total + hit.moneyOut + hit.debtTaken, 0);
}

/** Interest charged on every debt this run, whoever's decision opened it. */
export function interestPaid(run: RunState): number {
  return run.debts.reduce((total, d) => total + d.interestTotal, 0);
}

// ── What the player learned ─────────────────────────────────────────────────
function countConcepts(cards: PlayedCard[], applied: boolean): Map<ConceptId, number> {
  const counts = new Map<ConceptId, number>();
  for (const p of cards) {
    if (p.outcome.applied !== applied) continue;
    for (const id of p.outcome.concepts) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Ordered by how often it came up, then by the taxonomy so the order never wobbles. */
function ranked(counts: Map<ConceptId, number>): ConceptId[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || CONCEPT_IDS.indexOf(a[0]) - CONCEPT_IDS.indexOf(b[0]))
    .map(([id]) => id);
}

/** Concepts the player used to protect themselves. */
export function protectedBy(run: RunState): ConceptId[] {
  return ranked(countConcepts(playedCards(run), true));
}

/** Concepts that cost the player money this run. */
export function costlyConcepts(run: RunState): ConceptId[] {
  return ranked(countConcepts(playedCards(run), false));
}

export function conceptsSeen(run: RunState): ConceptId[] {
  const seen = new Set<ConceptId>();
  for (const p of playedCards(run)) for (const id of p.outcome.concepts) seen.add(id);
  return CONCEPT_IDS.filter((id) => seen.has(id));
}

export function tellsSeen(run: RunState): TellId[] {
  const seen = new Set<TellId>();
  for (const p of playedCards(run)) {
    for (const t of p.outcome.tells ?? []) seen.add(t);
    if (isTrap(p.card)) for (const t of p.card.pitch?.tells ?? []) seen.add(t);
  }
  return [...seen];
}

/**
 * What to draw more of next time.
 *
 * A concept is weak when it cost more than it protected. Counting both sides matters:
 * somebody who walked into one lender SMS and then refused three is not weak on
 * borrowing, and a game that kept telling them they were would be wrong and annoying.
 */
export function weakSpotsFrom(run: RunState): ConceptId[] {
  const missed = countConcepts(playedCards(run), false);
  const used = countConcepts(playedCards(run), true);
  return CONCEPT_IDS.filter((id) => (missed.get(id) ?? 0) > (used.get(id) ?? 0));
}

export const RULES_ON_REPORT = 3;

/**
 * Three rules to walk away with.
 *
 * The ones that cost money first, then the ones that worked, then whatever the run
 * never raised — so the list is always full, and the top of it is always the thing
 * this particular year actually taught. Rules of thumb rather than principles is the
 * one evidence-backed choice in the whole teaching model (Drexler, Fischer and Schoar,
 * 2014), and three is the number a tired person keeps.
 */
export function rulesOfThumb(run: RunState, limit = RULES_ON_REPORT): Concept[] {
  const order: ConceptId[] = [];
  for (const id of [...costlyConcepts(run), ...protectedBy(run), ...CONCEPT_IDS]) {
    if (!order.includes(id)) order.push(id);
  }
  return order.slice(0, limit).map(concept);
}

// ── Where to go next ────────────────────────────────────────────────────────
/**
 * The help lines for this run, most relevant first.
 *
 * Ordered by what actually happened, not by an editor's idea of importance: a player
 * who walked into a lender SMS sees the debt counsellor before the housing line. The
 * persona's own list comes first because it was curated for that life, and the rest
 * follow if they speak to a concept this year raised.
 */
export function helpLinesFor(run: RunState): HelpLine[] {
  const raised = new Set(conceptsSeen(run));
  const ordered: HelpLine[] = getPersona(run.personaId).helpLines.map(helpLine);
  const already = new Set(ordered.map((l) => l.id));

  for (const line of Object.values(HELP_LINES)) {
    if (already.has(line.id)) continue;
    const forThisLife = line.personas === "all" || line.personas.includes(run.personaId);
    if (!forThisLife) continue;
    if (!line.concepts.some((id) => raised.has(id))) continue;
    ordered.push(line);
  }

  return ordered;
}

// ── The statement ───────────────────────────────────────────────────────────
export type RunReport = {
  verdict: Verdict;
  name: string;
  monthsPlayed: number;
  months: number;
  cash: number;
  savings: number;
  debt: number;
  cushionMonths: number;
  trapCost: number;
  interestPaid: number;
  trapHits: TrapHit[];
  trapsSpotted: number;
  protectedBy: ConceptId[];
  rules: Concept[];
  conceptsSeen: ConceptId[];
  tellsSeen: TellId[];
  weakSpots: ConceptId[];
  helpLines: HelpLine[];
  factsAsOf: string;
};

export function runReport(run: RunState): RunReport {
  return {
    verdict: deriveVerdict(run),
    name: run.name,
    monthsPlayed: run.history.length,
    months: run.months,
    cash: run.cash,
    savings: run.savings,
    debt: debtTotal(run),
    cushionMonths: cushionMonths(run),
    trapCost: trapCost(run),
    interestPaid: interestPaid(run),
    trapHits: trapHits(run),
    trapsSpotted: trapsSpotted(run).length,
    protectedBy: protectedBy(run),
    rules: rulesOfThumb(run),
    conceptsSeen: conceptsSeen(run),
    tellsSeen: tellsSeen(run),
    weakSpots: weakSpotsFrom(run),
    helpLines: helpLinesFor(run),
    factsAsOf: run.factsAsOf,
  };
}
