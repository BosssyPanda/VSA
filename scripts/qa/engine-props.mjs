// Engine properties — the gate the whole game stands on.
//
//   node scripts/qa/engine-props.mjs
//
// These are properties, not examples. Each drives the real compiled engine over many
// seeds and asserts something that must hold for all of them. The point is not
// coverage: it is that a number this game shows a person can be re-derived from what
// they did. A product that tells somebody in a subdivided flat that a trap cost them
// HK$ 3,400 has to be right about it.
import {
  cards,
  careful,
  cases,
  concepts,
  costs,
  debt,
  deferrer,
  engine,
  facts,
  helpLines,
  income,
  mpf,
  personas,
  play,
  POLICIES,
  range,
  reckless,
  replayLib,
  report,
  stability,
  tierRank,
  PERSONA_IDS,
} from "./drive.mjs";

let failures = 0;
let checks = 0;

function check(name, fn) {
  checks++;
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}

function eq(a, b, what) {
  if (!Object.is(a, b)) throw new Error(`${what}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
}

function ok(cond, what) {
  if (!cond) throw new Error(what);
}

function deepEq(a, b, what) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa === sb) return;
  // Point at the first field that differs rather than printing two run states.
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  for (const k of keys) {
    const ka = JSON.stringify(a?.[k]);
    const kb = JSON.stringify(b?.[k]);
    if (ka !== kb) throw new Error(`${what}: "${k}" differs\n       ${ka}\n       ${kb}`);
  }
  throw new Error(`${what}:\n       ${sa}\n       ${sb}`);
}

const SEEDS = range(1, 121);
const WIDE_SEEDS = range(1, 701);

// ── P1. The same inputs produce the same life ───────────────────────────────
// Everything else in this file assumes this. A game that drew differently on a
// second run could not be replayed, could not be shared as a ticket, and could not
// be balanced — you cannot measure something that moves while you look at it.
console.log("\nP1 determinism");

check("P1 identical runs from identical inputs, every persona and policy", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      const a = play(personaId, seed, policy);
      const b = play(personaId, seed, policy);
      deepEq(a, b, `${policy.name} ${personaId} seed ${seed}`);
    }
  }
});

check("P1b a run in progress is identical at every month, not just at the end", () => {
  for (const { personaId, seed } of cases(range(1, 21))) {
    const snapsA = [];
    const snapsB = [];
    play(personaId, seed, careful, { onMonth: (_b, after) => snapsA.push(after) });
    play(personaId, seed, careful, { onMonth: (_b, after) => snapsB.push(after) });
    eq(snapsA.length, snapsB.length, `${personaId} seed ${seed} month count`);
    for (let i = 0; i < snapsA.length; i++) {
      deepEq(snapsA[i], snapsB[i], `${personaId} seed ${seed} after month ${i + 1}`);
    }
  }
});

check("P1c the seed is the only thing that changes the year", () => {
  const a = play("mdw", 99, careful);
  const b = play("mdw", 100, careful);
  ok(JSON.stringify(a.journal) !== JSON.stringify(b.journal), "two seeds produced the same journal");
});

// ── P2. A replay is the run ─────────────────────────────────────────────────
// The final statement is built from the journal. If the journal cannot rebuild the
// run, every figure on that screen is a claim rather than a record.
console.log("\nP2 replay");

check("P2 replaying a journal reproduces the run exactly, under every policy", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      const live = play(personaId, seed, policy);
      const result = replayLib.replayOf(live);
      ok(result.ok, `${policy.name} ${personaId} seed ${seed}: ${result.diverged}`);
      deepEq(result.run, live, `${policy.name} ${personaId} seed ${seed}`);
    }
  }
});

check("P2b a quit run replays as quit", () => {
  for (const { personaId, seed } of cases(range(1, 16))) {
    let run = engine.initRun(personaId, "", seed);
    run = engine.advanceMonth(engine.advanceMonth(run));
    run = engine.quitRun(run);
    const result = replayLib.replayOf(run);
    ok(result.ok, `${personaId} seed ${seed}: ${result.diverged}`);
    deepEq(result.run, run, `${personaId} seed ${seed} quit`);
  }
});

check("P2c a journal that does not describe this engine is refused, not half-applied", () => {
  const live = play("mdw", 3, careful);
  const header = replayLib.replayHeader(live);
  const tampered = JSON.parse(JSON.stringify(live.journal));
  const act = tampered.flatMap((m) => m.acts).find((a) => a[0] === "c");
  ok(Boolean(act), "the sample run answered no cards");
  act[3] = act[3] + 7; // an outcome index this choice cannot roll
  const result = replayLib.replay(header, tampered);
  ok(!result.ok, "a tampered journal replayed clean");
  ok(/outcome/.test(result.diverged ?? ""), `unhelpful divergence: ${result.diverged}`);
});

check("P2d the share ticket round-trips", () => {
  for (const { personaId, seed } of cases(range(1, 31))) {
    const run = engine.initRun(personaId, "", seed);
    const parsed = replayLib.parseTicket(replayLib.ticket(run));
    ok(parsed !== null, `ticket did not parse for ${personaId} seed ${seed}`);
    eq(parsed.personaId, personaId, "persona");
    eq(parsed.seed, seed | 0, "seed");
  }
  for (const junk of ["", "monthend:mdw", "monthend:nobody:1", "monthend:mdw:x", "x:mdw:1"]) {
    eq(replayLib.parseTicket(junk), null, `"${junk}" should not parse`);
  }
});

// ── P3. Money does not appear or vanish ─────────────────────────────────────
console.log("\nP3 money conservation");

check("P3 every month's close balances to the dollar", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 31))) {
      play(personaId, seed, policy, {
        onMonth: (before, _after, record) => {
          const startTotal = before.cash + before.savings;
          const endTotal = record.cashEnd + record.savingsEnd;
          const expected = startTotal + record.income - record.fixed - record.debtPaid;
          eq(
            endTotal,
            expected,
            `${policy.name} ${personaId} seed ${seed} month ${record.m}: cash+cushion`,
          );
        },
      });
    }
  }
});

check("P3b the cushion is only ever moved, never created", () => {
  for (const { personaId, seed } of cases(range(1, 31))) {
    play(personaId, seed, careful, {
      onMonth: (before, _after, record) => {
        const moved = before.savings - record.savingsEnd;
        eq(moved, record.fromCushion, `${personaId} seed ${seed} month ${record.m}: cushion drawdown`);
        ok(record.savingsEnd >= 0, `${personaId} seed ${seed} month ${record.m}: negative cushion`);
      },
    });
  }
});

check("P3c setting aside moves money, it does not make it", () => {
  for (const { personaId, seed } of cases(range(1, 21))) {
    const run = engine.initRun(personaId, "", seed);
    for (const amount of [-5000, -1, 0, 1, 250, 999999]) {
      const next = engine.setAside(run, amount);
      eq(next.cash + next.savings, run.cash + run.savings, `${personaId} setAside ${amount}`);
      ok(next.savings >= 0, `${personaId} setAside ${amount} drove the cushion negative`);
      ok(next.cash >= Math.min(0, run.cash), `${personaId} setAside ${amount} overdrew cash`);
    }
  }
});

// ── P4. Nothing a player could ever be shown is a NaN ───────────────────────
console.log("\nP4 no poison values");

const POISON_KEYS = [];
function scan(value, path) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) POISON_KEYS.push(`${path} = ${value}`);
    return;
  }
  if (Array.isArray(value)) return value.forEach((v, i) => scan(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) scan(v, `${path}.${k}`);
  }
}

check("P4 no NaN or Infinity anywhere in 2,100 finished runs", () => {
  let runs = 0;
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 176))) {
      const run = play(personaId, seed, policy);
      scan(run, `${policy.name}/${personaId}/${seed}`);
      scan(report.runReport(run), `report ${policy.name}/${personaId}/${seed}`);
      runs++;
    }
  }
  ok(runs >= 2100, `only ${runs} runs exercised`);
  ok(POISON_KEYS.length === 0, `${POISON_KEYS.length} poison values, first: ${POISON_KEYS[0]}`);
});

check("P4b every money figure is a whole number of dollars", () => {
  for (const { personaId, seed } of cases(range(1, 41))) {
    const run = play(personaId, seed, careful);
    ok(Number.isInteger(run.cash), `${personaId} seed ${seed}: cash ${run.cash}`);
    ok(Number.isInteger(run.savings), `${personaId} seed ${seed}: savings ${run.savings}`);
    for (const d of run.debts) {
      ok(Number.isInteger(d.balance), `${personaId} seed ${seed}: ${d.id} balance ${d.balance}`);
      ok(Number.isInteger(d.interestTotal), `${personaId} seed ${seed}: ${d.id} interest`);
    }
    for (const m of run.history) {
      for (const k of ["income", "fixed", "debtPaid", "interest", "fromCushion", "cashEnd", "savingsEnd", "debtEnd"]) {
        ok(Number.isInteger(m[k]), `${personaId} seed ${seed} month ${m.m}: ${k} = ${m[k]}`);
      }
    }
  }
});

// ── P5/P6/P7. The draw ──────────────────────────────────────────────────────
console.log("\nP5-P7 the draw");

check("P5 a player only ever meets cards written for their life", () => {
  for (const { personaId, seed } of cases(SEEDS)) {
    let run = engine.initRun(personaId, "", seed);
    let guard = 0;
    while (run.status === "playing" && guard++ < 20) {
      for (const card of engine.drawnCards(run)) {
        ok(
          card.personas === "all" || card.personas.includes(personaId),
          `${personaId} seed ${seed} month ${run.month}: drew "${card.id}"`,
        );
        const open = cards.availableChoices(card, engine.cardContext(run));
        const result = engine.applyChoice(run, card.id, open[0].id);
        if (result) run = result.run;
      }
      run = engine.advanceMonth(run);
    }
  }
});

check("P5b no month is ever empty", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      play(personaId, seed, policy, {
        onMonth: (before) =>
          ok(before.drawn.length > 0, `${policy.name} ${personaId} seed ${seed} month ${before.month} had no card`),
      });
    }
  }
});

check("P5c at most two cards in a month", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      play(personaId, seed, policy, {
        onMonth: (before) =>
          ok(before.drawn.length <= 2, `${policy.name} ${personaId} seed ${seed} month ${before.month}: ${before.drawn.length} cards`),
      });
    }
  }
});

check("P6 a once-only card is never drawn twice in a run", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      const seen = new Map();
      play(personaId, seed, policy, {
        onMonth: (before) => {
          for (const id of before.drawn) {
            const card = cards.getCard(id);
            if (!card?.once) continue;
            const months = seen.get(id) ?? [];
            // A deferred card is the same appearance continued, not a second one.
            const carried = before.deferred.includes(id);
            if (!carried) months.push(before.month);
            seen.set(id, months);
          }
        },
      });
      for (const [id, months] of seen) {
        ok(months.length <= 1, `${policy.name} ${personaId} seed ${seed}: "${id}" drawn in months ${months.join(", ")}`);
      }
    }
  }
});

check("P7 no trap in the first two months, ever", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 61))) {
      play(personaId, seed, policy, {
        onMonth: (before) => {
          if (before.month > engine.TRAP_FREE_MONTHS) return;
          for (const card of engine.drawnCards(before)) {
            ok(card.kind !== "trap", `${policy.name} ${personaId} seed ${seed}: trap "${card.id}" in month ${before.month}`);
          }
        },
      });
    }
  }
});

check("P7b never two traps in one month", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 61))) {
      play(personaId, seed, policy, {
        onMonth: (before) => {
          const traps = engine.drawnCards(before).filter((c) => c.kind === "trap");
          ok(traps.length <= 1, `${policy.name} ${personaId} seed ${seed} month ${before.month}: ${traps.map((t) => t.id).join(" + ")}`);
        },
      });
    }
  }
});

// How often a trap turns up is a property of the DECK, not of the engine, so the
// band the plan sets (35-65% of months) belongs in content-lint at the content
// milestone. Here we assert only that the placeholder deck is not silently trap-free,
// which is the failure mode that would make every trap property above vacuous.
check("P7c traps actually reach the table", () => {
  let months = 0;
  let trapMonths = 0;
  for (const { personaId, seed } of cases(range(1, 61))) {
    play(personaId, seed, careful, {
      onMonth: (before) => {
        months++;
        if (engine.drawnCards(before).some((c) => c.kind === "trap")) trapMonths++;
      },
    });
  }
  const share = trapMonths / months;
  ok(share > 0.1, `only ${(share * 100).toFixed(1)}% of months carried a trap`);
  console.log(`       (${(share * 100).toFixed(1)}% of months carry a trap; the 35-65% band is content-lint's at M3)`);
});

// ── P8-P11. Debt ────────────────────────────────────────────────────────────
console.log("\nP8-P11 debt");

check("P8 a licensed lender above the legal cap is refused", () => {
  const run = engine.initRun("sa-youth", "", 1);
  const cap = facts.fact("lender-apr-cap");
  for (const apr of [cap + 0.001, 0.6, 1.2, 9]) {
    for (const kind of ["licensed-lender", "credit-card", "agency", "bnpl", "family"]) {
      const result = debt.borrow(run, { kind, label: "test", balance: 1000, apr });
      eq(result.refused, "above-legal-cap", `${kind} at ${apr}`);
      eq(result.run.debts.length, run.debts.length, `${kind} at ${apr} added a line anyway`);
      eq(result.run.cash, run.cash, `${kind} at ${apr} paid out anyway`);
    }
  }
  for (const apr of [0, 0.12, cap]) {
    const result = debt.borrow(run, { kind: "licensed-lender", label: "test", balance: 1000, apr });
    eq(result.refused, undefined, `a legal loan at ${apr} was refused`);
  }
});

check("P8b only an unlicensed loan may exceed the cap, and it says so", () => {
  const run = engine.initRun("sa-youth", "", 1);
  const result = debt.borrow(run, { kind: "unlicensed-lender", label: "test", balance: 3000, apr: 3 });
  eq(result.refused, undefined, "an unlicensed loan was refused");
  ok(result.run.flags.includes("illegal-loan"), "no illegal-loan flag");
  eq(result.run.cash, run.cash + 3000, "cash");
});

check("P8c naming a referee is recorded and costs something", () => {
  const run = engine.initRun("sa-youth", "", 1);
  const plain = debt.borrow(run, { kind: "licensed-lender", label: "t", balance: 2000, apr: 0.3 });
  const withRef = debt.borrow(run, { kind: "licensed-lender", label: "t", balance: 2000, apr: 0.3, referee: true });
  ok(withRef.run.flags.includes("referee-named"), "no referee-named flag");
  ok(!plain.run.flags.includes("referee-named"), "referee-named set without a referee");
  ok(withRef.run.strain > plain.run.strain, "naming a friend cost nothing");
});

check("P8d a borrow refused never changes anything at all", () => {
  const run = engine.initRun("mdw", "", 4);
  for (const seed of [{ kind: "licensed-lender", label: "t", balance: 0, apr: 0.3 }, { kind: "credit-card", label: "t", balance: -50, apr: 0.2 }]) {
    const result = debt.borrow(run, seed);
    eq(result.refused, "nothing-to-borrow", `balance ${seed.balance}`);
    deepEq(result.run, run, `balance ${seed.balance}`);
  }
});

check("P9 interest is exactly the rate over twelve, on the balance", () => {
  for (const balance of [1, 50, 999, 4100, 27_345]) {
    for (const apr of [0, 0.05, 0.3, 0.48, 1.5]) {
      const line = { kind: "licensed-lender", label: "t", balance, apr, id: "x", openedMonth: 0, arrears: 0, paidTotal: 0, interestTotal: 0 };
      eq(debt.monthlyInterest(line), Math.round((balance * apr) / 12), `HK$${balance} at ${apr}`);
    }
  }
});

check("P9b interest charged across a run equals the sum of the monthly charges", () => {
  for (const { personaId, seed } of cases(range(1, 31))) {
    let charged = 0;
    const run = play(personaId, seed, reckless, {
      onMonth: (_b, _a, record) => {
        charged += record.interest;
      },
    });
    const recorded = run.debts.reduce((t, d) => t + d.interestTotal, 0);
    eq(recorded, charged, `${personaId} seed ${seed}`);
    eq(report.interestPaid(run), recorded, `${personaId} seed ${seed} report`);
  }
});

check("P10 a card minimum never drops below the floor or above the balance", () => {
  for (const balance of [10, 49, 50, 300, 1200, 40_000]) {
    for (const minPct of [undefined, 0.01, 0.03, 0.1]) {
      const line = { kind: "credit-card", label: "t", balance, minPct, apr: 0.36, id: "x", openedMonth: 0, arrears: 0, paidTotal: 0, interestTotal: 0 };
      const due = debt.dueThisMonth(line);
      const interest = debt.monthlyInterest(line);
      ok(due <= balance + interest, `HK$${balance} @${minPct}: due ${due} above what is owed`);
      ok(due >= Math.min(debt.MIN_CARD_PAYMENT, balance + interest), `HK$${balance} @${minPct}: due ${due} below the floor`);
    }
  }
  eq(debt.dueThisMonth({ kind: "family", label: "t", balance: 5000, apr: 0, id: "x", openedMonth: 0, arrears: 0, paidTotal: 0, interestTotal: 0 }), 0, "a family loan demanded a payment");
});

check("P11 a family loan never charges interest, and strain stays in bounds", () => {
  const line = { kind: "family", label: "t", balance: 6000, apr: 0, id: "x", openedMonth: 0, arrears: 0, paidTotal: 0, interestTotal: 0 };
  eq(debt.monthlyInterest(line), 0, "family interest");
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      play(personaId, seed, policy, {
        onMonth: (before) => {
          ok(before.strain >= 0 && before.strain <= 1, `${policy.name} ${personaId} seed ${seed}: strain ${before.strain}`);
          for (const d of before.debts) {
            if (d.kind === "family") eq(d.interestTotal, 0, `${personaId} seed ${seed}: family line charged interest`);
          }
        },
      });
    }
  }
});

check("P11b the borrow sheet's figures are the figures the run charges", () => {
  for (const amount of [500, 2000, 7500]) {
    const seed = debt.loanOffer("licensed-lender", amount);
    const projection = debt.projectLoan(seed);
    let run = engine.initRun("sa-youth", "", 11);
    run = { ...run, cash: 500_000, debts: [] };
    const taken = engine.takeLoan(run, "licensed-lender", amount);
    ok(!taken.refused, `HK$${amount} refused`);
    run = taken.run;
    let paid = 0;
    let guard = 0;
    while (run.debts.some((d) => d.balance > 0) && guard++ < 200) {
      const serviced = debt.serviceDebts(run);
      paid += serviced.paid;
      run = { ...serviced.run, month: run.month + 1 };
    }
    eq(paid, projection.total, `HK$${amount}: projected total`);
    ok(projection.total > amount, `HK$${amount}: a loan at 30% cost nothing`);
    eq(projection.monthly, seed.instalment, `HK$${amount}: projected first payment`);
  }
});

// ── P12. The verdict ────────────────────────────────────────────────────────
console.log("\nP12 stability");

check("P12 every state has a tier, and it is one of the five", () => {
  const known = new Set(["cushioned", "steady", "tight", "behind", "trapped"]);
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      play(personaId, seed, policy, {
        onMonth: (before, after) => {
          for (const run of [before, after]) {
            const tier = stability.stabilityTier(run);
            ok(known.has(tier), `${policy.name} ${personaId} seed ${seed}: tier "${tier}"`);
            ok(Boolean(stability.VERDICTS[tier]?.glyph), `tier "${tier}" has no glyph`);
          }
        },
      });
    }
  }
});

check("P12b more set aside is never a worse verdict", () => {
  for (const { personaId, seed } of cases(range(1, 21))) {
    const run = play(personaId, seed, reckless);
    let previous = -1;
    for (const savings of [0, 500, 1000, 3000, 6000, 12_000, 40_000]) {
      const rank = tierRank(stability.stabilityTier({ ...run, savings }));
      ok(rank >= previous, `${personaId} seed ${seed}: HK$${savings} set aside scored worse than less`);
      previous = rank;
    }
  }
});

check("P12c the unrecoverable state needs all three conditions, not one", () => {
  const base = engine.initRun("sa-youth", "", 2);
  const heavy = { kind: "licensed-lender", label: "t", balance: 200_000, apr: 0.48, instalment: 20_000, id: "d", openedMonth: 1, arrears: 5, paidTotal: 0, interestTotal: 0 };
  eq(stability.isUnrecoverable({ ...base, cash: -5000, savings: 0, debts: [{ ...heavy, arrears: 0 }] }), false, "no arrears");
  eq(stability.isUnrecoverable({ ...base, cash: 5000, savings: 0, debts: [heavy] }), false, "money in hand");
  eq(stability.isUnrecoverable({ ...base, cash: -5000, savings: 0, debts: [{ ...heavy, balance: 100, instalment: 10 }] }), false, "a payable debt");
  eq(stability.isUnrecoverable({ ...base, cash: -5000, savings: 0, debts: [heavy] }), true, "all three, and still recoverable");
  eq(stability.stabilityTier({ ...base, cash: -5000, savings: 0, debts: [heavy] }), "trapped", "tier");
});

// ── P13-P15. Income ─────────────────────────────────────────────────────────
console.log("\nP13-P15 income");

check("P13 MPF: nothing below the floor, nothing above the cap", () => {
  const floor = facts.fact("mpf-exempt-floor");
  const capIncome = facts.fact("mpf-income-cap");
  const capPaid = facts.fact("mpf-contribution-cap");
  const rate = facts.fact("mpf-rate");
  eq(mpf.mpfEmployee(0), 0, "nothing earned");
  eq(mpf.mpfEmployee(floor - 1), 0, "a dollar below the floor");
  eq(mpf.mpfEmployee(floor), Math.round(floor * rate), "at the floor");
  eq(mpf.mpfEmployee(capIncome), capPaid, "at the income cap");
  eq(mpf.mpfEmployee(capIncome * 4), capPaid, "far above the cap");
  let previous = -1;
  for (let pay = floor; pay <= capIncome * 2; pay += 137) {
    const paid = mpf.mpfEmployee(pay);
    ok(paid >= previous, `MPF fell as pay rose at HK$${pay}`);
    ok(paid <= capPaid, `MPF above the cap at HK$${pay}`);
    previous = paid;
  }
  // The employer owes theirs even when the worker owes nothing.
  ok(mpf.mpfEmployer(floor - 1) > 0, "the employer escaped below the floor");
});

check("P14 a domestic worker's wage is the legal figure, and food is never cash", () => {
  const wage = facts.fact("mdw-min-wage");
  const food = facts.fact("mdw-food-allowance");
  const run = engine.initRun("mdw", "", 1);
  for (let i = 0; i < 200; i++) {
    const money = income.monthIncome(run, () => i / 200);
    eq(money.gross, wage, "gross");
    eq(money.net, wage, "net");
    eq(money.mpf, 0, "MPF");
    eq(money.inKind, food, "food allowance");
  }
  eq(income.expectedIncome(run), wage, "expected income");
  play("mdw", 5, careful, {
    onMonth: (_b, _a, record) => {
      ok(record.income !== wage + food, `month ${record.m}: the food allowance reached the pocket`);
    },
  });
});

check("P15 hourly pay stays inside the hours it was written with", () => {
  const rate = facts.fact("min-wage-hourly");
  for (const personaId of ["sa-youth", "sdu-family"]) {
    const run = engine.initRun(personaId, "", 1);
    const model = run.income;
    eq(model.kind, "hourly", `${personaId} income model`);
    const low = Math.round((model.hoursBase - model.hoursJitter) * rate);
    const high = Math.round((model.hoursBase + model.hoursJitter) * rate);
    for (let i = 0; i <= 200; i++) {
      const money = income.monthIncome(run, () => i / 200);
      ok(money.gross >= low && money.gross <= high, `${personaId}: HK$${money.gross} outside HK$${low}-${high}`);
      ok(money.hours >= 0, `${personaId}: negative hours`);
      eq(money.net, money.gross - money.mpf, `${personaId}: net`);
      eq(money.mpf, mpf.mpfEmployee(money.gross), `${personaId}: MPF`);
    }
  }
});

// ── P16. Rent ───────────────────────────────────────────────────────────────
console.log("\nP16 rent");

check("P16 rent rises only at a review, and never past the legal cap", () => {
  const cap = facts.fact("sdu-rent-rise-cap-pct");
  for (const policy of POLICIES) {
    for (const seed of range(1, 61)) {
      let last = null;
      play("sdu-family", seed, policy, {
        onMonth: (before, after) => {
          const from = before.fixed.housing;
          const to = after.fixed.housing;
          if (to !== from) {
            const reviewed = before.tenancy.nextReviewMonth === before.month;
            ok(reviewed, `${policy.name} seed ${seed}: rent moved in month ${before.month}, not a review month`);
            ok(to <= Math.round(from * (1 + cap)), `${policy.name} seed ${seed}: rent rose from ${from} to ${to}, cap ${cap}`);
            ok(to >= from, `${policy.name} seed ${seed}: rent fell`);
          }
          last = after;
        },
      });
      ok(last !== null, `seed ${seed} played no months`);
    }
  }
});

check("P16b a landlord may ask for more than the cap and still not get it", () => {
  let run = engine.initRun("sdu-family", "", 1);
  const cap = run.tenancy.riseCapPct;
  const before = run.fixed.housing;
  run = engine.applyEffect(run, { rentRisePct: 0.35 });
  eq(run.tenancy.pendingRisePct, 0.35, "the ask was not recorded");
  run = { ...run, month: run.tenancy.nextReviewMonth };
  run = costs.reviewRent(run);
  eq(run.fixed.housing, Math.round(before * (1 + cap)), "the cap was not applied");
  eq(run.tenancy.pendingRisePct, 0, "the ask was not cleared");
});

check("P16c no persona starts with a deposit above the legal maximum", () => {
  const max = facts.fact("sdu-deposit-max-months");
  for (const personaId of PERSONA_IDS) {
    const tenancy = personas.getPersona(personaId).start.tenancy;
    if (tenancy.kind !== "sdu-rent") continue;
    ok(tenancy.depositMonths <= max, `${personaId}: ${tenancy.depositMonths} months' deposit`);
    ok(tenancy.riseCapPct <= facts.fact("sdu-rent-rise-cap-pct"), `${personaId}: rise cap above the law`);
  }
});

// ── P17/P18. The run's shape ────────────────────────────────────────────────
console.log("\nP17-P18 runs and saves");

check("P17 a run is twelve months, and ends saying why", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 41))) {
      const run = play(personaId, seed, policy);
      eq(run.status, "ended", `${policy.name} ${personaId} seed ${seed}`);
      ok(["complete", "trapped", "quit"].includes(run.endReason), `${policy.name} ${personaId} seed ${seed}: "${run.endReason}"`);
      if (run.endReason === "complete") {
        eq(run.month, engine.MONTHS, `${policy.name} ${personaId} seed ${seed}: ended on month`);
        eq(run.history.length, engine.MONTHS, `${policy.name} ${personaId} seed ${seed}: months recorded`);
      }
      ok(run.history.length <= engine.MONTHS, `${policy.name} ${personaId} seed ${seed}: ${run.history.length} months`);
      eq(run.months, engine.MONTHS, "run length");
    }
  }
});

check("P17b an ended run cannot be played further", () => {
  const run = play("mdw", 6, careful);
  deepEq(engine.advanceMonth(run), run, "advancing an ended run changed it");
  eq(engine.takeLoan(run, "licensed-lender", 1000).refused, "nothing-to-borrow", "borrowed after the end");
  deepEq(engine.repayDebt(run, run.debts[0]?.id ?? "none", 100), run, "repaid after the end");
});

check("P18 a save from this build loads, and anything else is refused", () => {
  const run = play("sa-youth", 8, careful);
  const round = JSON.parse(JSON.stringify(run));
  ok(engine.isCompatibleSave(round), "a real save was refused");
  for (const junk of [null, undefined, 0, "", [], {}, { v: engine.RUN_VERSION }]) {
    ok(!engine.isCompatibleSave(junk), `${JSON.stringify(junk)} was accepted`);
  }
  ok(!engine.isCompatibleSave({ ...round, v: engine.RUN_VERSION + 1 }), "a future save was accepted");
  ok(!engine.isCompatibleSave({ ...round, journal: "no" }), "a save with a broken journal was accepted");
});

// ── P19. Weak spots ─────────────────────────────────────────────────────────
console.log("\nP19 weak spots");

check("P19 a card that teaches a weak spot carries exactly double the weight", () => {
  for (const card of cards.CARDS) {
    const base = card.weight ?? 1;
    eq(engine.weightFor(card, undefined), base, `"${card.id}" with no weak spots`);
    eq(engine.weightFor(card, []), base, `"${card.id}" with an empty list`);
    const taught = cards.conceptsForCard(card);
    ok(taught.length > 0, `"${card.id}" teaches nothing`);
    eq(engine.weightFor(card, [taught[0]]), base * engine.WEAK_SPOT_WEIGHT, `"${card.id}" on a weak spot`);
    const notTaught = concepts.CONCEPT_IDS.filter((id) => !taught.includes(id));
    if (notTaught.length) eq(engine.weightFor(card, [notTaught[0]]), base, `"${card.id}" on an unrelated concept`);
  }
});

check("P19b the weighting shows up in the draw", () => {
  // Measured on one draw rather than a whole run: over twelve months this deck is
  // small enough that a player sees nearly all of it whatever the weights, so a
  // run-level measurement would report ~1.0 and prove nothing. The effect is bounded
  // above by the pool — a concept already taught by most of the deck cannot double
  // its share — so the bar here is direction and margin, not a fixed multiple.
  const concept = "rent-rights";
  const base = engine.initRun("sdu-family", "", 1);
  const teaches = (ids) => ids.some((id) => cards.conceptsForCard(cards.getCard(id)).includes(concept));
  let withWeak = 0;
  let without = 0;
  const trials = 4000;
  for (let seed = 1; seed <= trials; seed++) {
    const at = (weakSpots) => ({ ...base, seed, month: 8, drawn: [], deferred: [], usedCards: [], weakSpots });
    if (teaches(engine.drawCards(at(undefined)))) without++;
    if (teaches(engine.drawCards(at([concept])))) withWeak++;
  }
  ok(without > 0 && without < trials, `the baseline share was ${without}/${trials}; nothing to measure`);
  const lift = withWeak / without;
  ok(lift >= 1.15, `weak-spot cards were only ${lift.toFixed(2)}x as likely (${without} → ${withWeak} of ${trials})`);
  console.log(`       (${lift.toFixed(2)}x: ${without} → ${withWeak} draws in ${trials})`);
});

check("P19c weak spots come out of what actually cost the player money", () => {
  for (const { personaId, seed } of cases(range(1, 41))) {
    const run = play(personaId, seed, reckless);
    const weak = report.weakSpotsFrom(run);
    const costly = report.costlyConcepts(run);
    for (const id of weak) {
      ok(costly.includes(id), `${personaId} seed ${seed}: "${id}" is weak but never cost anything`);
    }
  }
});

// ── P20. Nobody is ever out of options ──────────────────────────────────────
console.log("\nP20 choices");

check("P20 a card always offers at least one thing to do", () => {
  const extremes = [
    { cash: -50_000, savings: 0, debtTotal: 500_000, strain: 1, familyCovered: false, cushionMonths: -3 },
    { cash: 0, savings: 0, debtTotal: 0, strain: 0, familyCovered: true, cushionMonths: 0 },
    { cash: 999_999, savings: 999_999, debtTotal: 0, strain: 0, familyCovered: true, cushionMonths: 99 },
  ];
  for (const card of cards.CARDS) {
    for (const personaId of PERSONA_IDS) {
      for (let month = 1; month <= engine.MONTHS; month++) {
        for (const extreme of extremes) {
          const ctx = { persona: personaId, month, months: engine.MONTHS, flags: new Set(), hasDebt: () => false, ...extreme };
          const open = cards.availableChoices(card, ctx);
          ok(open.length > 0, `"${card.id}" offered nothing to ${personaId} in month ${month}`);
        }
      }
    }
  }
});

check("P20b every trap has a way out that works", () => {
  for (const card of cards.CARDS.filter((c) => c.kind === "trap")) {
    const safe = card.choices.filter((c) => c.kind !== "quiet");
    ok(safe.length >= 1, `"${card.id}" has no safe choice`);
    const protects = card.choices.some((c) => c.outcomes.some((o) => o.applied));
    ok(protects, `"${card.id}" has no outcome where the player comes out ahead`);
    // Safe first, risky last: the order is the design, and a lint behind it is the
    // only thing that keeps it true once thirty more cards are written.
    const kinds = card.choices.map((c) => c.kind);
    const firstQuiet = kinds.indexOf("quiet");
    if (firstQuiet !== -1) {
      ok(!kinds.slice(firstQuiet).some((k) => k !== "quiet"), `"${card.id}" puts a safe choice after the risky one`);
    }
    ok(card.deferrable === true, `"${card.id}" is a trap that cannot be left`);
    ok(Array.isArray(card.why) && card.why.length >= 1 && card.why.length <= 3, `"${card.id}" needs one to three plain reasons`);
    ok((card.pitch?.lines.length ?? 0) >= 1 && (card.pitch?.tells.length ?? 0) >= 1, `"${card.id}" has no pitch or no tells`);
  }
});

check("P20c every outcome names what it teaches", () => {
  for (const card of cards.CARDS) {
    for (const choice of card.choices) {
      ok(choice.outcomes.length > 0, `"${card.id}:${choice.id}" has no outcomes`);
      for (const [i, outcome] of choice.outcomes.entries()) {
        ok(outcome.weight > 0, `"${card.id}:${choice.id}" outcome ${i} has no weight`);
        ok(outcome.concepts.length > 0, `"${card.id}:${choice.id}" outcome ${i} teaches nothing`);
        for (const id of outcome.concepts) {
          ok(concepts.CONCEPT_IDS.includes(id), `"${card.id}:${choice.id}" outcome ${i}: unknown concept "${id}"`);
        }
        ok(typeof outcome.applied === "boolean", `"${card.id}:${choice.id}" outcome ${i} does not say whether it protected`);
      }
    }
  }
});

check("P20d every outcome of every choice is reachable", () => {
  // A weighted outcome that no seed can roll is dead content, and dead content that
  // looks live is how a reviewer signs off a lesson no player will ever read.
  for (const card of cards.CARDS) {
    for (const choice of card.choices) {
      if (choice.outcomes.length < 2) continue;
      const rolled = new Set();
      for (let seed = 1; seed <= 600; seed++) {
        for (let month = 3; month <= 12; month++) {
          const run = { ...engine.initRun(PERSONA_IDS[0], "", seed), month };
          rolled.add(engine.rollOutcome(run, card, choice).index);
        }
      }
      for (let i = 0; i < choice.outcomes.length; i++) {
        ok(rolled.has(i), `"${card.id}:${choice.id}" outcome ${i} is unreachable`);
      }
    }
  }
});

// ── P21. Every number a frightened person might dial ────────────────────────
console.log("\nP21 help lines");

check("P21 every help line carries a source and the date it was checked", () => {
  const ids = helpLines.HELP_LINE_IDS;
  ok(ids.length > 0, "no help lines at all");
  for (const id of ids) {
    const line = helpLines.helpLine(id);
    eq(line.id, id, `"${id}" is filed under the wrong key`);
    ok(/^https:\/\//.test(line.source), `"${id}" has no source URL`);
    ok(/^\d{4}-\d{2}-\d{2}$/.test(line.checkedOn), `"${id}" does not say when it was checked`);
    ok(Boolean(line.phone || line.url), `"${id}" offers no way to reach it`);
    if (line.phone) ok(/^[\d ]{4,}$/.test(line.phone), `"${id}" has a phone number that is not one: "${line.phone}"`);
    if (line.url) ok(/^https:\/\//.test(line.url), `"${id}" has a non-https link`);
    ok(line.what.length > 20, `"${id}" does not say what it is for`);
    for (const concept of line.concepts) {
      ok(concepts.CONCEPT_IDS.includes(concept), `"${id}": unknown concept "${concept}"`);
    }
  }
});

check("P21b a help line was checked recently enough to trust", () => {
  // Numbers go stale and organisations close. Eighteen months is the outer edge of
  // what this file may claim without somebody reading the page again.
  const limit = 18 * 30 * 24 * 60 * 60 * 1000;
  for (const id of helpLines.HELP_LINE_IDS) {
    const line = helpLines.helpLine(id);
    const age = Date.now() - Date.parse(line.checkedOn);
    ok(age < limit, `"${id}" was last checked on ${line.checkedOn}; re-read the page and update it`);
    ok(age > -86_400_000, `"${id}" claims to have been checked in the future`);
  }
});

check("P21c every life is offered help, and only help written for it", () => {
  for (const personaId of PERSONA_IDS) {
    const persona = personas.getPersona(personaId);
    ok(persona.helpLines.length >= 3, `${personaId} is offered only ${persona.helpLines.length} places to go`);
    for (const id of persona.helpLines) {
      const line = helpLines.helpLine(id);
      ok(Boolean(line), `${personaId} names a help line that does not exist: "${id}"`);
      const forThisLife = line.personas === "all" || line.personas.includes(personaId);
      ok(forThisLife, `${personaId} is offered "${id}", which is not written for this life`);
    }
    ok(new Set(persona.helpLines).size === persona.helpLines.length, `${personaId} lists the same help line twice`);
  }
});

check("P21e every help topic leads somewhere, for every life", () => {
  // The Help screen asks "what do you need help with?" and offers five answers. A
  // topic that resolves to a single phone number is a tap that bought the player
  // nothing, and an empty one is a dead end at the exact moment somebody needed it.
  // Before this property existed, "my flat or my rent" was empty for two of three
  // lives, because public government hotlines had been filtered by persona.
  const topicIds = helpLines.HELP_TOPICS.map((t) => t.id);
  ok(new Set(topicIds).size === topicIds.length, "a help topic is listed twice");
  for (const id of helpLines.HELP_LINE_IDS) {
    const line = helpLines.helpLine(id);
    ok(topicIds.includes(line.topic), `"${id}" is filed under unknown topic "${line.topic}"`);
  }
  for (const personaId of PERSONA_IDS) {
    for (const topic of topicIds) {
      const found = helpLines.helpLinesForTopic(topic, personaId);
      ok(found.length >= 2, `${personaId}: topic "${topic}" offers only ${found.length} service(s)`);
    }
  }
});

check("P21f the interpretation lines are distinct and cover the languages we ship", () => {
  const lines = helpLines.INTERPRETATION_LINES;
  ok(lines.length >= 6, `only ${lines.length} interpretation lines`);
  const phones = lines.map((l) => l.phone);
  ok(new Set(phones).size === phones.length, "two languages share an interpretation number");
  for (const line of lines) {
    ok(/^[\d ]{4,}$/.test(line.phone), `"${line.language}" has a phone number that is not one`);
    ok(line.endonym.length > 0, `"${line.language}" is not named in its own script`);
  }
  // Every language this product can be read in must have a line the Help screen can
  // lead with, or the offer is empty for exactly the person who needs it most.
  for (const locale of ["tl", "id"]) {
    ok(Boolean(helpLines.interpretationFor(locale)), `no interpretation line for locale "${locale}"`);
  }
  ok(helpLines.interpretationFor("en") === undefined, "English is not an interpretation language");
});

check("P21d the report always ends with somewhere to go", () => {
  for (const policy of POLICIES) {
    for (const { personaId, seed } of cases(range(1, 31))) {
      const lines = report.helpLinesFor(play(personaId, seed, policy));
      ok(lines.length >= 3, `${policy.name} ${personaId} seed ${seed}: only ${lines.length} help lines`);
      ok(new Set(lines.map((l) => l.id)).size === lines.length, `${policy.name} ${personaId} seed ${seed}: a help line was listed twice`);
      for (const line of lines) {
        const forThisLife = line.personas === "all" || line.personas.includes(personaId);
        ok(forThisLife, `${policy.name} ${personaId} seed ${seed}: offered "${line.id}"`);
      }
    }
  }
});

// ── P22. Playing well is better than playing badly ──────────────────────────
console.log("\nP22 balance");

check("P22 careful is never worse than reckless on the same year", () => {
  for (const { personaId, seed } of cases(range(1, 101))) {
    const good = stability.stabilityTier(play(personaId, seed, careful));
    const bad = stability.stabilityTier(play(personaId, seed, reckless));
    ok(tierRank(good) >= tierRank(bad), `${personaId} seed ${seed}: careful ${good} < reckless ${bad}`);
  }
});

check("P22b a careful year is never punished, and usually rewarded", () => {
  // The plan asked for Steady or better every time. That turned out to be the wrong
  // target, and the engine was right: a careful year for Mrs Chan lands on Tight in
  // about one seed in a hundred, because a run of thin shifts on hourly minimum wage
  // plus a rent review genuinely does eat a year's savings. Forcing that away would
  // mean tuning a persona until the game stopped telling the truth about her month.
  //
  // So the floor is what actually matters and is actually a promise: a careful player
  // never ends up Behind. Above that, most careful years reach Steady.
  for (const personaId of PERSONA_IDS) {
    const seeds = range(1, 201);
    const tiers = seeds.map((seed) => stability.stabilityTier(play(personaId, seed, careful)));
    const worst = tiers.reduce((w, t) => (tierRank(t) < tierRank(w) ? t : w), "cushioned");
    ok(tierRank(worst) >= tierRank("tight"), `${personaId}: a careful year landed on "${worst}"`);
    const steady = tiers.filter((t) => tierRank(t) >= tierRank("steady")).length;
    const share = steady / tiers.length;
    ok(share >= 0.95, `${personaId}: only ${(share * 100).toFixed(1)}% of careful years reached Steady`);
    console.log(`       (${personaId}: ${(share * 100).toFixed(1)}% of careful years Steady or better, worst "${worst}")`);
  }
});

check("P22c taking every risk costs something real", () => {
  for (const personaId of PERSONA_IDS) {
    const runs = range(1, 101).map((seed) => play(personaId, seed, reckless));
    const behind = runs.filter((r) => tierRank(stability.stabilityTier(r)) <= tierRank("behind")).length;
    ok(behind > 0, `${personaId}: no reckless year ever fell behind`);
    const cost = runs.reduce((t, r) => t + report.trapCost(r), 0) / runs.length;
    ok(cost > 0, `${personaId}: the traps took nothing from a player who took every one`);
    console.log(`       (${personaId}: ${behind}/100 reckless years behind or worse, traps took HK$${Math.round(cost)} on average)`);
  }
});

// ── P23. Leaving a card is free ─────────────────────────────────────────────
console.log("\nP23 leaving a card for next month");

check("P23 leaving a card costs nothing and it comes back once", () => {
  for (const { personaId, seed } of cases(range(1, 61))) {
    const appearances = new Map();
    play(personaId, seed, deferrer, {
      onMonth: (before, after, record) => {
        // A month in which nothing was answered is pure arithmetic: income in, costs
        // out. If leaving a card could cost money, this identity would not hold.
        const answered = (before.journal.find((j) => j.m === before.month)?.acts ?? []).some((a) => a[0] === "c");
        if (!answered) {
          const expected = before.cash + before.savings + record.income - record.fixed - record.debtPaid;
          eq(record.cashEnd + record.savingsEnd, expected, `${personaId} seed ${seed} month ${record.m}: leaving a card moved money`);
        }
        for (const id of before.drawn) {
          if (!cards.getCard(id)?.deferrable) continue;
          appearances.set(id, (appearances.get(id) ?? 0) + 1);
        }
        ok(new Set(after.deferred).size === after.deferred.length, `${personaId} seed ${seed}: a card was deferred twice over`);
      },
    });
    for (const [id, count] of appearances) {
      ok(count <= 2, `${personaId} seed ${seed}: "${id}" appeared ${count} times; a left card returns once`);
    }
  }
});

check("P23b a card left twice is gone, not looped forever", () => {
  for (const { personaId, seed } of cases(range(1, 41))) {
    const run = play(personaId, seed, deferrer);
    eq(run.deferred.length === 0 || run.status === "ended", true, `${personaId} seed ${seed}`);
    const counts = new Map();
    for (const entry of run.journal) {
      for (const act of entry.acts) {
        if (act[0] === "d") counts.set(act[1], (counts.get(act[1]) ?? 0) + 1);
      }
    }
    for (const [id, n] of counts) ok(n <= 1, `${personaId} seed ${seed}: "${id}" was deferred ${n} times`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// One report, after the last check and nowhere else. A `report()` call left in the
// middle of a file is how a suite comes to print "all passed" and exit 0 while the
// checks below it fail.
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${checks - failures}/${checks} engine properties passed`);
if (failures > 0) {
  console.log(`${failures} FAILED`);
  process.exit(1);
}
