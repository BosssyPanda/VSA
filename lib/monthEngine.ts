import { mulberry32, strHash } from "./rng";
import { FACTS_AS_OF } from "./facts";
import { getPersona } from "./personas";
import { availableChoices, conceptsForCard, eligibleCards, getCard, isTrap } from "./cards";
import { cushionMonths, applyDrift, drawFromCushion, fixedLine, fixedTotal, reviewRent } from "./costs";
import { borrow, debtTotal, hasDebt, loanOffer, repay, serviceDebts } from "./debt";
import type { PlayerLoanKind } from "./debt";
import { expectedIncome, monthIncome } from "./income";
import { clamp } from "./format";
import { stabilityTier } from "./stability";
import type {
  Card,
  CardContext,
  Choice,
  ConceptId,
  DebtSeed,
  EndReason,
  JournalAct,
  MonthClose,
  MoneyEffect,
  Outcome,
  PersonaId,
  RunState,
} from "./types";

/**
 * The month, as a pure function.
 *
 * Nothing in this file touches the DOM, the clock or global state, so the whole engine
 * runs headless in the property harness and a run can be replayed from its journal and
 * produce the same numbers. That property is what lets a report be trusted: a figure a
 * player is shown at the end has to be derivable from what they actually did.
 */

export const RUN_VERSION = 1;

/** One year. Fixed in this version: one arc, one balance target, one review load. */
export const MONTHS = 12;

/** No trap card in the first two months. A person deserves to learn the shape first. */
export const TRAP_FREE_MONTHS = 2;

/** How often a month carries a second card. */
export const TWO_CARD_CHANCE = 0.3;

/** How much more likely a card is when it teaches something you keep getting wrong. */
export const WEAK_SPOT_WEIGHT = 2;

// ── Seeded streams ──────────────────────────────────────────────────────────
// Three separate streams. If income jitter and card draws shared one, a card that
// happened to ask for one extra random number would change which cards came next —
// and a replay that skipped a UI-only draw would silently diverge.
const drawRng = (run: RunState) => mulberry32(run.seed + run.month * 101);
const incomeRng = (run: RunState) => mulberry32(run.seed + run.month * 151);
const outcomeRng = (run: RunState, cardId: string, choiceId: string) =>
  mulberry32(run.seed + run.month * 131 + strHash(`${cardId}:${choiceId}`));

// ── Starting a run ──────────────────────────────────────────────────────────
export function initRun(
  personaId: PersonaId,
  name: string,
  seed: number,
  opts: { weakSpots?: ConceptId[] } = {},
): RunState {
  const persona = getPersona(personaId);
  const start = persona.start;

  const run: RunState = {
    v: RUN_VERSION,
    seed: seed | 0,
    personaId,
    // An empty name is not an error. The name field is optional on purpose, and a
    // player who skips it plays as the persona.
    name: name.trim() || persona.name,
    status: "playing",
    month: 1,
    months: MONTHS,
    cash: start.cash,
    savings: start.savings,
    debts: start.debts.map((seedLine, i) => ({
      ...seedLine,
      id: `${seedLine.kind}-start-${i}`,
      openedMonth: 0,
      arrears: 0,
      paidTotal: 0,
      interestTotal: 0,
    })),
    income: start.income,
    incomeMods: [],
    fixed: { ...start.fixed },
    fixedMods: [],
    tenancy: { ...start.tenancy },
    dependants: start.dependants,
    strain: 0,
    familyCovered: true,
    flags: [...start.flags],
    usedCards: [],
    drawn: [],
    deferred: [],
    resolved: {},
    history: [],
    journal: [],
    factsAsOf: FACTS_AS_OF,
    weakSpots: opts.weakSpots,
  };

  return { ...run, drawn: drawCards(run) };
}

// ── Reading the run ─────────────────────────────────────────────────────────
export function cardContext(run: RunState): CardContext {
  return {
    persona: run.personaId,
    month: run.month,
    months: run.months,
    cash: run.cash,
    savings: run.savings,
    cushionMonths: cushionMonths(run),
    debtTotal: debtTotal(run),
    strain: run.strain,
    familyCovered: run.familyCovered,
    flags: new Set(run.flags),
    hasDebt: (kind) => hasDebt(run, kind),
  };
}

/** Cards on the table this month, in draw order. */
export function drawnCards(run: RunState): Card[] {
  return run.drawn.map((id) => getCard(id)).filter((c): c is Card => Boolean(c));
}

export function isResolved(run: RunState, cardId: string): boolean {
  return cardId in run.resolved;
}

export function allCardsResolved(run: RunState): boolean {
  return run.drawn.every((id) => isResolved(run, id));
}

/** A drawn, unresolved card that may simply be left for next month. */
export function deferrableCards(run: RunState): Card[] {
  return drawnCards(run).filter((c) => c.deferrable && !isResolved(run, c.id));
}

// ── Drawing ─────────────────────────────────────────────────────────────────
/**
 * How likely this card is, given what the player keeps getting wrong.
 *
 * Exported so the property suite can check the rule itself rather than guess at its
 * effect. The effect is not a fixed multiple of the draw probability and cannot be:
 * when most of the eligible pool already teaches a concept, doubling one card's weight
 * cannot double a share that is already past half. The weight is the promise; the
 * probability is whatever the deck makes of it.
 */
export function weightFor(card: Card, weakSpots: ConceptId[] | undefined): number {
  const base = card.weight ?? 1;
  if (!weakSpots || weakSpots.length === 0) return base;
  const teaches = conceptsForCard(card).some((id) => weakSpots.includes(id));
  return teaches ? base * WEAK_SPOT_WEIGHT : base;
}

function pickWeighted(cards: Card[], weakSpots: ConceptId[] | undefined, rand: () => number): Card {
  const weights = cards.map((c) => weightFor(c, weakSpots));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rand() * total;
  for (let i = 0; i < cards.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return cards[i];
  }
  return cards[cards.length - 1];
}

/**
 * This month's cards.
 *
 * A card left unanswered last month comes back first, at no cost — that is the whole
 * mechanism behind "not sure? leave it", and it is why nothing in this game needs a
 * timer to create a decision.
 */
export function drawCards(run: RunState): string[] {
  const rand = drawRng(run);
  const ctx = cardContext(run);
  const picked: string[] = [];

  for (const id of run.deferred) {
    const card = getCard(id);
    if (card) picked.push(card.id);
  }

  const wantTwo = rand() < TWO_CARD_CHANCE;
  const target = Math.max(1, Math.min(2, picked.length + (wantTwo ? 2 : 1)));

  let pool = eligibleCards(ctx, run.usedCards).filter((c) => !picked.includes(c.id));
  if (run.month <= TRAP_FREE_MONTHS) pool = pool.filter((c) => !isTrap(c));

  while (picked.length < target && pool.length > 0) {
    // Never two traps in one month. Two pitches at once teaches nothing except that
    // the world is hostile, which this audience does not need a game to tell them.
    const alreadyTrapped = picked.some((id) => {
      const card = getCard(id);
      return card ? isTrap(card) : false;
    });
    const candidates = alreadyTrapped ? pool.filter((c) => !isTrap(c)) : pool;
    if (candidates.length === 0) break;
    const card = pickWeighted(candidates, run.weakSpots, rand);
    picked.push(card.id);
    pool = pool.filter((c) => c.id !== card.id);
  }

  return picked;
}

// ── Resolving a card ────────────────────────────────────────────────────────
export function rollOutcome(
  run: RunState,
  card: Card,
  choice: Choice,
): { outcome: Outcome; index: number } {
  const rand = outcomeRng(run, card.id, choice.id);
  const total = choice.outcomes.reduce((a, o) => a + Math.max(0, o.weight), 0);
  let roll = rand() * total;
  for (let i = 0; i < choice.outcomes.length; i++) {
    roll -= Math.max(0, choice.outcomes[i].weight);
    if (roll <= 0) return { outcome: choice.outcomes[i], index: i };
  }
  const last = choice.outcomes.length - 1;
  return { outcome: choice.outcomes[last], index: last };
}

/**
 * Apply one outcome's money.
 *
 * `rentRisePct` is queued rather than applied: a landlord may ask for anything, and
 * `reviewRent` is the single place the legal cap gets enforced. Keeping that in one
 * place is what makes the protection real rather than a claim in some card's copy.
 */
export function applyEffect(run: RunState, effect: MoneyEffect): RunState {
  let next: RunState = { ...run };

  if (effect.cash) next = { ...next, cash: next.cash + effect.cash };
  if (effect.savings) {
    // Never spend a cushion that is not there.
    const delta = Math.max(effect.savings, -next.savings);
    next = { ...next, savings: next.savings + delta };
  }
  if (effect.strain) next = { ...next, strain: clamp(next.strain + effect.strain, 0, 1) };
  if (effect.familyCovered !== undefined) next = { ...next, familyCovered: effect.familyCovered };

  if (effect.income) {
    next = {
      ...next,
      incomeMods: [
        ...next.incomeMods,
        { monthly: effect.income.monthly, until: next.month + effect.income.months - 1 },
      ],
    };
  }

  if (effect.fixed) {
    const { field, monthly, months } = effect.fixed;
    if (months === undefined) {
      next = { ...next, fixed: { ...next.fixed, [field]: Math.max(0, next.fixed[field] + monthly) } };
    } else {
      next = {
        ...next,
        fixedMods: [...next.fixedMods, { field, monthly, until: next.month + months - 1 }],
      };
    }
  }

  if (effect.addDebt) {
    const seed: DebtSeed = effect.addDebt;
    // `borrow` already credits the cash, so an effect that names both a loan and the
    // money it provides would pay twice. Cards state the cash they receive; the loan
    // here is the liability only.
    const result = borrow({ ...next, cash: next.cash - seed.balance }, seed);
    next = result.refused ? next : result.run;
  }

  if (effect.payDebt) {
    const { kind, amount } = effect.payDebt;
    let left = Math.max(0, amount);
    next = {
      ...next,
      debts: next.debts.map((d) => {
        if (d.kind !== kind || left <= 0 || d.balance <= 0) return d;
        const paid = Math.min(left, d.balance);
        left -= paid;
        return { ...d, balance: d.balance - paid, paidTotal: d.paidTotal + paid };
      }),
    };
  }

  if (effect.rentRisePct && next.tenancy.kind === "sdu-rent") {
    next = {
      ...next,
      tenancy: {
        ...next.tenancy,
        pendingRisePct: Math.max(next.tenancy.pendingRisePct, effect.rentRisePct),
      },
    };
  }

  return next;
}

function appendAct(run: RunState, act: JournalAct): RunState["journal"] {
  const journal = [...run.journal];
  const current = journal[journal.length - 1];
  if (current && current.m === run.month) {
    journal[journal.length - 1] = { ...current, acts: [...current.acts, act] };
  } else {
    journal.push({ m: run.month, acts: [act] });
  }
  return journal;
}

export type ChoiceResult = { run: RunState; outcome: Outcome; index: number };

export function applyChoice(run: RunState, cardId: string, choiceId: string): ChoiceResult | null {
  const card = getCard(cardId);
  if (!card || isResolved(run, cardId)) return null;
  const ctx = cardContext(run);
  const choice = availableChoices(card, ctx).find((c) => c.id === choiceId);
  if (!choice) return null;

  const { outcome, index } = rollOutcome(run, card, choice);
  let next = applyEffect(run, outcome.effect);

  const flags = new Set(next.flags);
  for (const f of outcome.setFlags ?? []) flags.add(f);
  for (const f of outcome.clearFlags ?? []) flags.delete(f);

  next = {
    ...next,
    flags: [...flags],
    resolved: { ...next.resolved, [cardId]: { choiceId, outcomeIdx: index } },
    usedCards: next.usedCards.includes(cardId) ? next.usedCards : [...next.usedCards, cardId],
    deferred: next.deferred.filter((id) => id !== cardId),
  };
  next = { ...next, journal: appendAct(next, ["c", cardId, choiceId, index]) };

  return { run: next, outcome, index };
}

// ── Player money actions ────────────────────────────────────────────────────
// Each of these writes exactly one journal act, and each is reconstructable from that
// act alone — kind plus amount is enough, because `loanOffer` derives the terms. That
// is the whole reason a replay can charge the same interest as the run it replays.

export type LoanResult = { run: RunState; refused?: "above-legal-cap" | "nothing-to-borrow" };

/** Borrow, as the player's own decision. Card-imposed debt goes through `applyEffect`. */
export function takeLoan(run: RunState, kind: PlayerLoanKind, amount: number): LoanResult {
  if (run.status === "ended") return { run, refused: "nothing-to-borrow" };
  const seed = loanOffer(kind, amount);
  if (!seed) return { run, refused: "nothing-to-borrow" };
  const result = borrow(run, seed);
  if (result.refused) return { run, refused: result.refused };
  const next = result.run;
  return { run: { ...next, journal: appendAct(next, ["b", kind, seed.balance]) } };
}

/** Pay down one debt line by hand. */
export function repayDebt(run: RunState, debtId: string, amount: number): RunState {
  if (run.status === "ended") return run;
  const next = repay(run, debtId, amount);
  if (next === run) return run;
  const paid = run.cash - next.cash;
  return { ...next, journal: appendAct(next, ["r", debtId, paid]) };
}

/** Move money between the pocket and the cushion. Positive sets aside. */
export function setAside(run: RunState, amount: number): RunState {
  const delta = Math.round(amount);
  const moved = delta >= 0 ? Math.min(delta, Math.max(0, run.cash)) : Math.max(delta, -run.savings);
  if (moved === 0) return run;
  const next = { ...run, cash: run.cash - moved, savings: run.savings + moved };
  return { ...next, journal: appendAct(next, ["s", moved]) };
}

// ── Closing the month ───────────────────────────────────────────────────────
export function endRun(run: RunState, reason: EndReason): RunState {
  return { ...run, status: "ended", endReason: reason };
}

export function quitRun(run: RunState): RunState {
  return endRun(run, "quit");
}

/**
 * Close the month and open the next one.
 *
 * Order matters and is stated once, here: money in, fixed costs out, debts serviced,
 * rent reviewed, temporary changes expired, the month recorded, and only then the end
 * checks. Servicing debts before the rent review means a rise never retroactively
 * makes last month's payment unaffordable.
 */
export function advanceMonth(run: RunState): RunState {
  if (run.status === "ended") return run;

  const income = monthIncome(run, incomeRng(run));
  let next: RunState = { ...run, cash: run.cash + income.net };

  const fixed = fixedTotal(next);
  next = { ...next, cash: next.cash - fixed };

  // The cushion covers the shortfall before anything is called short. Rent and food do
  // not wait for payday, and money set aside is exactly what a person reaches for.
  const covered = drawFromCushion(next.cash, next.savings);
  next = { ...next, cash: covered.cash, savings: covered.savings };

  // "Covered" means the money owed to people actually went out: board at home, or the
  // remittance. A month that leaves the family short is a different kind of bad month
  // from one that leaves you short, and the report says which one it was.
  //
  // Checked here, between the fixed costs and the debts, because a debt instalment
  // taking the last of the cash is not the same as failing your family — the money to
  // them had already gone out.
  const familyLine = fixedLine(next, "family");
  const familyCovered = familyLine <= 0 || next.cash >= 0;
  next = { ...next, familyCovered };

  const serviced = serviceDebts(next);
  next = serviced.run;

  next = reviewRent(next);
  next = applyDrift(next);

  next = {
    ...next,
    incomeMods: next.incomeMods.filter((m) => m.until >= next.month),
    fixedMods: next.fixedMods.filter((m) => m.until >= next.month),
  };

  const close: MonthClose = {
    income: income.net,
    fixed,
    debtPaid: serviced.paid,
    interest: serviced.interest,
    fromCushion: covered.drawn + serviced.fromCushion,
    cashEnd: next.cash,
    savingsEnd: next.savings,
    debtEnd: debtTotal(next),
    familyCovered,
  };

  const journal = [...next.journal];
  const current = journal[journal.length - 1];
  if (current && current.m === next.month) journal[journal.length - 1] = { ...current, end: close };
  else journal.push({ m: next.month, acts: [], end: close });

  next = {
    ...next,
    journal,
    history: [
      ...next.history,
      { ...close, m: next.month, cards: [...next.drawn], tier: stabilityTier(next) },
    ],
  };

  if (next.month >= next.months) return endRun(next, "complete");

  // Anything still on the table that may be left, is left — no penalty, and it comes
  // back once. Anything that may not be deferred is simply spent.
  const carried = next.drawn.filter((id) => {
    const card = getCard(id);
    return Boolean(card?.deferrable) && !isResolved(next, id) && !next.deferred.includes(id);
  });
  for (const id of carried) {
    next = { ...next, journal: appendAct(next, ["d", id]) };
  }

  const spent = new Set(next.usedCards);
  for (const id of next.drawn) if (!carried.includes(id)) spent.add(id);

  next = {
    ...next,
    month: next.month + 1,
    deferred: carried,
    usedCards: [...spent],
  };

  return { ...next, drawn: drawCards(next) };
}

/** A run this build can load. Anything else is refused rather than half-restored. */
export function isCompatibleSave(value: unknown): value is RunState {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<RunState>;
  return (
    run.v === RUN_VERSION &&
    typeof run.seed === "number" &&
    typeof run.personaId === "string" &&
    typeof run.month === "number" &&
    Array.isArray(run.debts) &&
    Array.isArray(run.journal) &&
    typeof run.cash === "number"
  );
}

export { expectedIncome };
