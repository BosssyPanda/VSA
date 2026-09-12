import { fact } from "./facts";
import { drawFromCushion } from "./costs";
import { expectedIncome } from "./income";
import { clamp } from "./format";
import type { DebtKind, DebtLine, DebtSeed, PlayerLoanKind, RunState } from "./types";

/** Below this a card minimum stops being a percentage and becomes a floor. */
export const MIN_CARD_PAYMENT = 50;

/** Why a borrow was refused. Shown to the player in plain words, never swallowed. */
export type BorrowRefusal = "above-legal-cap" | "nothing-to-borrow";

export function debtTotal(run: RunState): number {
  return run.debts.reduce((t, d) => t + d.balance, 0);
}

/** Interest for one month. Simple accrual — the game explains a rate, not a formula. */
export function monthlyInterest(line: DebtLine): number {
  return Math.round((line.balance * line.apr) / 12);
}

/**
 * What this line demands this month.
 *
 * Family loans demand nothing, which is exactly what makes them dangerous in a
 * different way: they cost no interest and accumulate something harder to repay.
 */
export function dueThisMonth(line: DebtLine): number {
  if (line.balance <= 0) return 0;
  const interest = monthlyInterest(line);
  switch (line.kind) {
    case "family":
      return 0;
    case "credit-card": {
      const minimum = Math.max(Math.round(line.balance * (line.minPct ?? 0.03)), MIN_CARD_PAYMENT);
      return Math.min(minimum, line.balance + interest);
    }
    default:
      return Math.min(line.instalment ?? line.balance + interest, line.balance + interest);
  }
}

/** Everything owed this month across every line. */
export function debtService(run: RunState): number {
  return run.debts.reduce((t, d) => t + dueThisMonth(d), 0);
}

export function hasDebt(run: RunState, kind: DebtKind): boolean {
  return run.debts.some((d) => d.kind === kind && d.balance > 0);
}

/** Rising, flat or falling over the last three closed months. */
export function debtTrend(run: RunState): "down" | "flat" | "up" {
  const recent = run.history.slice(-3);
  if (recent.length < 2) return "flat";
  const delta = recent[recent.length - 1].debtEnd - recent[0].debtEnd;
  if (delta > 50) return "up";
  if (delta < -50) return "down";
  return "flat";
}

/**
 * A debt line's id.
 *
 * Derived from the run's own state — kind, month, and how many lines already exist —
 * rather than from a counter or a clock. A module-level counter would make the id
 * depend on how many runs this process had simulated, which is fine in a browser with
 * one run and wrong in the property harness with two thousand, and wrong in exactly
 * the way that makes a replay stop matching the run it replays.
 */
function debtId(run: RunState, seed: DebtSeed): string {
  return `${seed.kind}-m${run.month}-${run.debts.length}`;
}

/**
 * Take on a debt.
 *
 * A licensed lender above the legal cap is refused rather than simulated, and the
 * refusal is a teaching moment: the rate itself is what makes the loan unenforceable.
 * An unlicensed loan can exceed it, which is the whole difference between the two and
 * the reason the flag is set.
 *
 * This does NOT write to the journal, and that is deliberate. A card outcome can add a
 * debt, and a card outcome is already journalled as the choice that caused it — so a
 * `borrow` that journalled too would record the same loan twice, and replaying that
 * journal would take the loan twice. Journalling belongs to whoever started the
 * action: `takeLoan` in the month engine for a player's own borrowing, nothing at all
 * for a loan a card imposed.
 */
export function borrow(
  run: RunState,
  seed: DebtSeed,
): { run: RunState; line?: DebtLine; refused?: BorrowRefusal } {
  if (seed.balance <= 0) return { run, refused: "nothing-to-borrow" };
  if (seed.kind !== "unlicensed-lender" && seed.apr > fact("lender-apr-cap")) {
    return { run, refused: "above-legal-cap" };
  }

  const line: DebtLine = {
    ...seed,
    id: debtId(run, seed),
    openedMonth: run.month,
    arrears: 0,
    paidTotal: 0,
    interestTotal: 0,
  };

  const flags = new Set(run.flags);
  if (seed.kind === "unlicensed-lender") flags.add("illegal-loan");
  if (seed.referee) flags.add("referee-named");

  // Leaning on somebody costs something that is not interest.
  const strain = run.strain + (seed.kind === "family" ? 0.15 : 0) + (seed.referee ? 0.1 : 0);

  return {
    run: {
      ...run,
      cash: run.cash + seed.balance,
      debts: [...run.debts, line],
      flags: [...flags],
      strain: clamp(strain, 0, 1),
    },
    line,
  };
}

export function repay(run: RunState, debtId: string, amount: number): RunState {
  const line = run.debts.find((d) => d.id === debtId);
  if (!line) return run;
  const paid = Math.max(0, Math.min(Math.round(amount), run.cash, line.balance));
  if (paid === 0) return run;
  return {
    ...run,
    cash: run.cash - paid,
    // Paying back a person buys back a little of what borrowing from them cost.
    strain: clamp(run.strain - (line.kind === "family" ? 0.05 : 0), 0, 1),
    debts: run.debts.map((d) =>
      d.id === debtId ? { ...d, balance: d.balance - paid, paidTotal: d.paidTotal + paid } : d,
    ),
  };
}

export type ServiceResult = {
  run: RunState;
  paid: number;
  interest: number;
  /** What could not be paid. This is the number that turns a hard month into a spiral. */
  shortfall: number;
  /** Taken out of the cushion to keep a payment on time. */
  fromCushion: number;
};

/**
 * Charge interest, take what is due, and record what could not be paid.
 *
 * Payments come out of cash automatically, because they do in life: the instalment is
 * taken, the card is charged, and what is left is what you live on. When cash runs
 * short the cushion is drawn on before anything is recorded as missed — that is what a
 * cushion is, and an engine that marked a saver in arrears would be lying about the
 * one habit this game is trying to build. Arrears count months rather than money,
 * since it is the count a lender escalates on.
 */
export function serviceDebts(run: RunState): ServiceResult {
  let cash = run.cash;
  let savings = run.savings;
  let paid = 0;
  let interest = 0;
  let shortfall = 0;
  let fromCushion = 0;
  let strain = run.strain;
  const flags = new Set(run.flags);

  const debts = run.debts.map((line) => {
    if (line.balance <= 0) return line;

    const owedInterest = monthlyInterest(line);
    let balance = line.balance + owedInterest;
    interest += owedInterest;

    const due = Math.min(dueThisMonth(line), balance);
    if (due > cash) {
      const covered = drawFromCushion(cash - due, savings);
      savings = covered.savings;
      cash = covered.cash + due;
      fromCushion += covered.drawn;
    }
    const payable = Math.max(0, Math.min(due, cash));
    cash -= payable;
    balance -= payable;
    paid += payable;

    let arrears = line.arrears;
    if (payable + 0.001 < due) {
      shortfall += due - payable;
      arrears += 1;
      flags.add("missed-payment");
      strain += 0.05;
    } else if (due > 0) {
      arrears = 0;
    }

    // A family loan going unpaid month after month costs something else instead.
    if (line.kind === "family" && line.strainPerMonthLate && run.month - line.openedMonth >= 3) {
      strain += line.strainPerMonthLate;
    }

    return {
      ...line,
      balance: Math.max(0, Math.round(balance)),
      arrears,
      paidTotal: line.paidTotal + payable,
      interestTotal: line.interestTotal + owedInterest,
    };
  });

  return {
    run: { ...run, cash, savings, debts, strain: clamp(strain, 0, 1), flags: [...flags] },
    paid,
    interest,
    shortfall,
    fromCushion,
  };
}

/** The most months any single line has gone unpaid. */
export function worstArrears(run: RunState): number {
  return run.debts.reduce((worst, d) => Math.max(worst, d.arrears), 0);
}

/** Debt service as a share of a normal month's pay. */
export function debtBurden(run: RunState): number {
  const income = expectedIncome(run);
  return income <= 0 ? Infinity : debtService(run) / income;
}

// ── What a loan would cost, before taking it ────────────────────────────────
/**
 * The two loans a player can choose to take.
 *
 * Not an open field. Offering an arbitrary rate would make the Borrow sheet a
 * calculator, and the point of the sheet is the comparison: a licensed lender at a
 * legal rate, or a person who will not charge interest and will remember.
 */
export const PLAYER_LOAN_KINDS: readonly PlayerLoanKind[] = ["licensed-lender", "family"];
export type { PlayerLoanKind };

/** A licensed lender's term and rate in this game. Legal, and expensive anyway. */
export const LOAN_TERM_MONTHS = 12;
export const LICENSED_APR = 0.3;

/**
 * Monthly payment that clears `balance` over `months` at `apr`, the ordinary way.
 *
 * Rounded UP, never to nearest, and the difference is the whole honesty of the Borrow
 * sheet. At HK$ 1,000 the exact instalment is HK$ 97.49; rounding it down to HK$ 97
 * leaves a few dollars of balance standing after the twelfth payment, so the engine
 * takes a thirteenth of HK$ 19 — and the sheet, which promises twelve months, becomes
 * a lie of exactly the kind this product exists to teach people to catch. A dollar up
 * costs the player one dollar a month and makes the term on the screen the real term.
 */
function amortised(balance: number, apr: number, months: number): number {
  const r = apr / 12;
  if (r <= 0) return Math.ceil(balance / months);
  return Math.ceil((balance * r) / (1 - Math.pow(1 + r, -months)));
}

/**
 * The terms attached to an amount the player asked for.
 *
 * Deterministic, and derived only from the kind and the amount, because the journal
 * records a borrow as kind plus amount and a replay has to rebuild the identical debt
 * line from that alone.
 */
export function loanOffer(kind: PlayerLoanKind, amount: number): DebtSeed | null {
  const balance = Math.round(amount);
  if (balance <= 0) return null;
  if (kind === "family") {
    return {
      kind: "family",
      label: "Borrowed from family",
      balance,
      apr: 0,
      strainPerMonthLate: 0.03,
    };
  }
  return {
    kind: "licensed-lender",
    label: "Licensed money lender",
    balance,
    apr: LICENSED_APR,
    instalment: amortised(balance, LICENSED_APR, LOAN_TERM_MONTHS),
  };
}

export type LoanProjection = {
  /** What comes out next month. The number a lender advertises. */
  monthly: number;
  /** What comes out in total before the balance reaches zero. The number that matters. */
  total: number;
  interest: number;
  months: number;
};

/**
 * What this loan actually costs, month by month.
 *
 * Simulated with the same arithmetic `serviceDebts` uses rather than a closed-form
 * formula, so the figure on the Borrow sheet is the figure the run will charge. A
 * projection that quietly disagreed with the engine would be the product telling the
 * player the same kind of half-truth it is teaching them to spot.
 */
function dueFrom(line: DebtLine, balanceWithInterest: number): number {
  if (line.kind === "family") return 0;
  if (line.kind === "credit-card") {
    return Math.max(Math.round(balanceWithInterest * (line.minPct ?? 0.03)), MIN_CARD_PAYMENT);
  }
  return line.instalment ?? balanceWithInterest;
}

export function projectLoan(seed: DebtSeed, capMonths = 120): LoanProjection {
  const line: DebtLine = {
    ...seed,
    id: "projection",
    openedMonth: 0,
    arrears: 0,
    paidTotal: 0,
    interestTotal: 0,
  };
  let balance = line.balance;
  let total = 0;
  let interest = 0;
  let monthly = 0;
  let months = 0;

  while (balance > 0 && months < capMonths) {
    const owed = Math.round((balance * line.apr) / 12);
    balance += owed;
    interest += owed;
    const due = Math.min(dueFrom(line, balance), balance);
    if (due <= 0) break; // a family loan demands nothing; it is repaid by choice
    balance = Math.max(0, Math.round(balance - due));
    total += due;
    months += 1;
    if (months === 1) monthly = due;
  }

  return { monthly, total, interest, months };
}
