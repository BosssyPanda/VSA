import { PALETTE } from "./palette";
import { cushionMonths } from "./costs";
import { debtBurden, debtTrend, worstArrears } from "./debt";
import type { RunState, StabilityTier, Verdict } from "./types";

/** Missed payments for this many months running means the month has stopped working. */
export const TRAPPED_ARREARS_MONTHS = 3;
/** Debt service above this share of a normal month's pay is not survivable. */
export const TRAPPED_BURDEN = 1;

/**
 * Is this run past saving?
 *
 * Three things at once, not one: months of missed payments, nothing left anywhere, and
 * a debt bill larger than a month's pay. Any one of those alone is a bad patch, and a
 * game that called a bad patch a failure would be lying about what recovery looks like.
 */
export function isUnrecoverable(run: RunState): boolean {
  return (
    worstArrears(run) >= TRAPPED_ARREARS_MONTHS &&
    run.cash + run.savings < 0 &&
    debtBurden(run) > TRAPPED_BURDEN
  );
}

/**
 * How this month stands.
 *
 * Never net worth. The question this game asks is whether the month works, and the
 * answer is made of four things a person can actually feel: are payments being missed,
 * is the debt growing, is there anything set aside, and did the family get what was
 * promised.
 */
export function stabilityTier(run: RunState): StabilityTier {
  if (isUnrecoverable(run)) return "trapped";
  if (worstArrears(run) > 0 || debtTrend(run) === "up") return "behind";
  const cushion = cushionMonths(run);
  if (cushion < 0.5) return "tight";
  if (cushion < 1 || !run.familyCovered) return "steady";
  return "cushioned";
}

/**
 * The wording is placeholder until community reviewers have been through it.
 *
 * Every tier carries a glyph as well as a colour, because a colour alone excludes
 * anyone who cannot distinguish these two hues, and because a screenshot shared on
 * WhatsApp is often read in greyscale.
 */
export const VERDICTS: Record<StabilityTier, Verdict> = {
  cushioned: {
    tier: "cushioned",
    title: "Cushioned",
    blurb: "A month of pay set aside, nothing behind, everyone covered. A bad month would not become a loan.",
    hex: PALETTE.accent,
    glyph: "▲▲",
  },
  steady: {
    tier: "steady",
    title: "Steady",
    blurb: "The month works. Something is set aside, and nothing is chasing you.",
    hex: PALETTE.accent,
    glyph: "▲",
  },
  tight: {
    tier: "tight",
    title: "Tight",
    blurb: "Payments are made, but there is nothing spare. One thin month is all it would take.",
    hex: PALETTE.ink,
    glyph: "▬",
  },
  behind: {
    tier: "behind",
    title: "Behind",
    blurb: "Something is unpaid or the debt is growing. This is the point where help is cheapest.",
    hex: PALETTE.warn,
    glyph: "▼",
  },
  trapped: {
    tier: "trapped",
    title: "Stuck",
    blurb: "The payments are bigger than the pay. This is not a personal failure, and there are people whose job is exactly this.",
    hex: PALETTE.warn,
    glyph: "▼▼",
  },
};

export function deriveVerdict(run: RunState): Verdict {
  return VERDICTS[stabilityTier(run)];
}

/** The closed set of end-of-run words this build can produce. */
export const KNOWN_VERDICTS: ReadonlySet<string> = new Set(
  Object.values(VERDICTS).map((v) => v.title),
);
