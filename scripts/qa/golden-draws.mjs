// Golden draws — a fingerprint of nine recorded years.
//
//   node scripts/qa/golden-draws.mjs           check against the recorded file
//   node scripts/qa/golden-draws.mjs --write    re-record it (read the diff first)
//
// The properties say the engine is self-consistent. This says it has not silently
// changed. Edit a fact, a persona's rent, a card's weight or the order of the deck and
// nine years move; the diff is the review. That matters more here than in most games,
// because the figures are real Hong Kong figures and "the numbers moved and nobody
// noticed" is precisely the failure this product cannot have.
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import {
  careful,
  costs,
  debt,
  engine,
  facts,
  play,
  reckless,
  report,
  stability,
  PERSONA_IDS,
} from "./drive.mjs";

const FILE = path.join(process.cwd(), "scripts/qa/golden-draws.json");
const SEEDS = [1, 42, 7919];
const POLICIES = [careful, reckless];

function record() {
  const years = {};
  for (const policy of POLICIES) {
    for (const personaId of PERSONA_IDS) {
      for (const seed of SEEDS) {
        const months = [];
        const run = play(personaId, seed, policy, {
          onMonth: (before, _after, close) => {
            months.push({
              m: close.m,
              cards: before.drawn,
              income: close.income,
              fixed: close.fixed,
              debtPaid: close.debtPaid,
              interest: close.interest,
              fromCushion: close.fromCushion,
              cashEnd: close.cashEnd,
              savingsEnd: close.savingsEnd,
              debtEnd: close.debtEnd,
              familyCovered: close.familyCovered,
              tier: close.tier,
            });
          },
        });
        const summary = report.runReport(run);
        years[`${policy.name}/${personaId}/${seed}`] = {
          months,
          end: {
            reason: run.endReason,
            tier: summary.verdict.tier,
            cash: run.cash,
            savings: run.savings,
            debt: debt.debtTotal(run),
            cushionMonths: Number(costs.cushionMonths(run).toFixed(4)),
            strain: Number(run.strain.toFixed(4)),
            flags: [...run.flags].sort(),
            trapCost: summary.trapCost,
            interestPaid: summary.interestPaid,
            trapsSpotted: summary.trapsSpotted,
            rules: summary.rules.map((r) => r.id),
            weakSpots: summary.weakSpots,
          },
        };
      }
    }
  }

  return {
    note: "Regenerate with `npm run qa:golden -- --write` and read the diff before committing it.",
    runVersion: engine.RUN_VERSION,
    months: engine.MONTHS,
    factsAsOf: facts.FACTS_AS_OF,
    // Every fact, so a figure that changes shows up here even if no year moves.
    facts: Object.fromEntries(
      Object.values(facts.FACTS)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((f) => [f.id, { value: f.value, unit: f.unit, asOf: f.asOf }]),
    ),
    verdicts: Object.fromEntries(
      Object.values(stability.VERDICTS).map((v) => [v.tier, { title: v.title, glyph: v.glyph }]),
    ),
    years,
  };
}

const fresh = record();

if (process.argv.includes("--write")) {
  writeFileSync(FILE, `${JSON.stringify(fresh, null, 2)}\n`, "utf8");
  console.log(`golden draws written → ${FILE}`);
  process.exit(0);
}

let recorded;
try {
  recorded = JSON.parse(readFileSync(FILE, "utf8"));
} catch {
  console.log(`no golden draws recorded. Run: npm run qa:golden -- --write`);
  process.exit(1);
}

/** The first place two trees disagree, as a path a person can go and look at. */
function firstDiff(a, b, at = "") {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return `${at || "(root)"}: recorded ${JSON.stringify(a)}, now ${JSON.stringify(b)}`;
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const found = firstDiff(a[key], b[key], at ? `${at}.${key}` : key);
    if (found) return found;
  }
  return `${at || "(root)"}: recorded ${JSON.stringify(a)}, now ${JSON.stringify(b)}`;
}

const diff = firstDiff(recorded, fresh);
if (!diff) {
  const years = Object.keys(fresh.years).length;
  const months = Object.values(fresh.years).reduce((t, y) => t + y.months.length, 0);
  console.log(`golden draws match: ${years} recorded years, ${months} months, ${Object.keys(fresh.facts).length} facts`);
  process.exit(0);
}

console.log("golden draws MOVED");
console.log(`  ${diff}`);
console.log("\nIf the change is intended, re-record it and review the diff:");
console.log("  npm run qa:golden -- --write && git diff scripts/qa/golden-draws.json");
process.exit(1);
