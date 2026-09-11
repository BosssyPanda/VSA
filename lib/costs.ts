import { fact } from "./facts";
import { expectedIncome } from "./income";
import type { FixedField, RunState } from "./types";

/** What goes out every month before anything happens. */
export function fixedTotal(run: RunState): number {
  const base = Object.values(run.fixed).reduce((a, b) => a + b, 0);
  const mods = run.fixedMods.reduce((total, m) => (m.until >= run.month ? total + m.monthly : total), 0);
  return Math.max(0, base + mods);
}

/** One line of it, including any temporary change. */
export function fixedLine(run: RunState, field: FixedField): number {
  const mods = run.fixedMods.reduce(
    (total, m) => (m.field === field && m.until >= run.month ? total + m.monthly : total),
    0,
  );
  return Math.max(0, run.fixed[field] + mods);
}

/**
 * Prices drift once a year, not every month.
 *
 * Housing is excluded on purpose: rent does not creep, it jumps at renewal, and the
 * rules governing that jump are a thing the game teaches. Folding it into a smooth
 * drift would hide the one moment a tenant has rights.
 */
export function applyDrift(run: RunState): RunState {
  if (run.month === 0 || run.month % 12 !== 0) return run;
  const rate = 1 + fact("cpi-yoy");
  return {
    ...run,
    fixed: {
      ...run.fixed,
      food: Math.round(run.fixed.food * rate),
      transport: Math.round(run.fixed.transport * rate),
      other: Math.round(run.fixed.other * rate),
    },
  };
}

/**
 * The rent review.
 *
 * A card may have the landlord ask for any rise at all — they do — but the law caps a
 * renewal rise at 10%, and this is where that cap is applied. The clamp lives in the
 * engine rather than in the card copy so that the protection is real: whatever a card
 * says, a regulated tenancy cannot rise faster than this.
 */
export function reviewRent(run: RunState): RunState {
  const t = run.tenancy;
  if (t.kind !== "sdu-rent" || run.month !== t.nextReviewMonth) return run;
  const asked = t.pendingRisePct;
  const granted = Math.min(asked, t.riseCapPct);
  return {
    ...run,
    fixed: { ...run.fixed, housing: Math.round(run.fixed.housing * (1 + granted)) },
    tenancy: {
      ...t,
      pendingRisePct: 0,
      nextReviewMonth: t.nextReviewMonth + t.termMonths,
    },
  };
}

/**
 * How much a full cushion is.
 *
 * One month of pay, not one month of costs. Both are defensible; this one is
 * explainable in four words to somebody who is tired, and an explainable target that
 * gets used beats a precise one that does not.
 */
export function cushionTarget(run: RunState): number {
  return Math.max(1, expectedIncome(run));
}

/** The cushion, in months of pay. */
export function cushionMonths(run: RunState): number {
  return run.savings / cushionTarget(run);
}

/**
 * The cushion doing the one job it has.
 *
 * When cash runs out, money set aside is moved back to cover the gap — before a
 * payment is recorded as missed and before the family line is recorded as short. This
 * is not a convenience. "Money set aside so a bad month does not become a loan" is the
 * rule this whole product is built to teach, and an engine that left the cushion
 * untouched while marking the player in arrears would be teaching the opposite.
 */
export function drawFromCushion(
  cash: number,
  savings: number,
): { cash: number; savings: number; drawn: number } {
  if (cash >= 0 || savings <= 0) return { cash, savings, drawn: 0 };
  const drawn = Math.min(savings, -cash);
  return { cash: cash + drawn, savings: savings - drawn, drawn };
}
