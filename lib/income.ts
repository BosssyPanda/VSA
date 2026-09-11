import { fact } from "./facts";
import { mpfEmployee } from "./mpf";
import type { IncomeModel, RunState } from "./types";

export type MonthIncome = {
  /** Before anything is taken off. */
  gross: number;
  /** What actually lands in hand. */
  net: number;
  mpf: number;
  /** Hourly work only. The number that makes a thin month thin. */
  hours?: number;
  /** Paid in kind, never cash. Shown so the ledger tells the truth about it. */
  inKind?: number;
};

/** Temporary changes a card made to income, for the months they still apply. */
function activeMods(run: RunState): number {
  return run.incomeMods.reduce((total, m) => (m.until >= run.month ? total + m.monthly : total), 0);
}

/**
 * This month's money in.
 *
 * `rand` is a seeded generator on its own stream, so an hour of variable shift work
 * cannot shift which cards get drawn. Two things that both look like "randomness"
 * sharing a stream is how a replay quietly stops matching the run it replays.
 */
export function monthIncome(run: RunState, rand: () => number): MonthIncome {
  const model: IncomeModel = run.income;
  const mods = activeMods(run);

  if (model.kind === "hourly") {
    // Shift work is not a salary. The jitter is the point: an employer who cuts you
    // to four days is the most common income shock this audience actually meets.
    const swing = Math.round((rand() * 2 - 1) * model.hoursJitter);
    const hours = Math.max(0, model.hoursBase + swing);
    const gross = Math.round(hours * fact(model.rateFact)) + mods;
    const mpf = mpfEmployee(gross);
    return { gross, net: gross - mpf, mpf, hours };
  }

  if (model.kind === "salary") {
    const gross = model.monthly + mods;
    const mpf = model.mpf ? mpfEmployee(gross) : 0;
    return { gross, net: gross - mpf, mpf };
  }

  // A live-in domestic worker's wage is fixed by law, and the food allowance is not
  // wages: it is paid in kind or in cash for food, and treating it as spendable money
  // is exactly the confusion that gets someone into a loan.
  const gross = fact(model.wageFact) + mods;
  return { gross, net: gross, mpf: 0, inKind: fact(model.foodFact) };
}

/**
 * What a normal month brings in, with no luck in it.
 *
 * Used for the cushion target and for judging whether debt has become unpayable, so
 * it must not move with a lucky roll.
 */
export function expectedIncome(run: RunState): number {
  const model = run.income;
  const mods = activeMods(run);
  if (model.kind === "hourly") {
    const gross = Math.round(model.hoursBase * fact(model.rateFact)) + mods;
    return gross - mpfEmployee(gross);
  }
  if (model.kind === "salary") {
    const gross = model.monthly + mods;
    return gross - (model.mpf ? mpfEmployee(gross) : 0);
  }
  return fact(model.wageFact) + mods;
}
