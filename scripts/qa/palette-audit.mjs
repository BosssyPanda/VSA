// The palette gate.
//
//   node scripts/qa/palette-audit.mjs
//
// DESIGN.md states the rule this enforces: a pairing that has not been measured does
// not ship, and a palette change means `lib/palette.ts`, the `@theme` block in
// `app/globals.css` and the palette section of DESIGN.md, in one commit.
//
// This reads both files as TEXT rather than importing them. A gate that needs a
// TypeScript build to check sixteen hex literals is a gate that gets skipped.
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TS = readFileSync(join(ROOT, "lib/palette.ts"), "utf8");
const CSS = readFileSync(join(ROOT, "app/globals.css"), "utf8");

/** Every source file the design rules apply to. */
function sourceFiles(dirs = ["app", "components", "lib"]) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.(tsx?|css)$/.test(entry)) out.push(rel);
    }
  };
  for (const d of dirs) walk(d);
  return out;
}

let checks = 0;
let failures = 0;

function check(name, fn) {
  checks++;
  try {
    const note = fn();
    console.log(`  ok   ${name}${note ? `  ${note}` : ""}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}

// ── WCAG 2.1 relative luminance ─────────────────────────────────────────────
function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// ── Read both sources ───────────────────────────────────────────────────────
const tsColors = {};
for (const [, key, hex] of TS.matchAll(/^\s{2}(\w+):\s*"(#[0-9a-f]{6})",/gm)) tsColors[key] = hex;

const cssColors = {};
for (const [, key, hex] of CSS.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/g)) cssColors[key] = hex;

const camel = (kebab) => kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const PAIRS = [];
const pairBlock = TS.match(/CONTRAST_PAIRS[\s\S]*?\] as const;/);
if (pairBlock) {
  for (const [, fg, bg] of pairBlock[0].matchAll(/\["(\w+)",\s*"(\w+)"\]/g)) PAIRS.push([fg, bg]);
}

const MIN = Number((TS.match(/MIN_CONTRAST\s*=\s*([\d.]+)/) ?? [])[1] ?? 4.5);

// ── Checks ──────────────────────────────────────────────────────────────────
check("lib/palette.ts declares colours", () => {
  const n = Object.keys(tsColors).length;
  if (n < 8) throw new Error(`only ${n} colours parsed — did the file shape change?`);
  return `${n} colours`;
});

check("app/globals.css @theme mirrors lib/palette.ts", () => {
  const cssAsCamel = Object.fromEntries(Object.entries(cssColors).map(([k, v]) => [camel(k), v]));
  const drift = [];
  for (const [key, hex] of Object.entries(tsColors)) {
    if (!(key in cssAsCamel)) drift.push(`--color-${key} missing from globals.css`);
    else if (cssAsCamel[key] !== hex) drift.push(`${key}: ts ${hex} vs css ${cssAsCamel[key]}`);
  }
  for (const key of Object.keys(cssAsCamel)) {
    if (!(key in tsColors)) drift.push(`--color-${key} has no entry in lib/palette.ts`);
  }
  if (drift.length) throw new Error(drift.join("; "));
  return `${Object.keys(tsColors).length} tokens agree`;
});

check(`every declared pairing clears ${MIN}:1`, () => {
  if (PAIRS.length === 0) throw new Error("no CONTRAST_PAIRS parsed");
  const bad = [];
  const notes = [];
  for (const [fg, bg] of PAIRS) {
    if (!tsColors[fg] || !tsColors[bg]) {
      bad.push(`${fg} on ${bg}: unknown colour`);
      continue;
    }
    const ratio = contrast(tsColors[fg], tsColors[bg]);
    notes.push(`${fg}/${bg} ${ratio.toFixed(2)}`);
    if (ratio < MIN) bad.push(`${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
  }
  if (bad.length) throw new Error(bad.join("; "));
  return `${PAIRS.length} pairs · worst ${Math.min(...PAIRS.map(([f, b]) => contrast(tsColors[f], tsColors[b]))).toFixed(2)}:1`;
});

check("warning red is spent only on money at risk", () => {
  // A colour that appears in a decorative place stops meaning what it means. The
  // warning token may only be referenced where something is actually at risk: the
  // warning card, the arrears row, the two end-of-year tiers that mean a payment is
  // unpaid or the debt is growing, and the tokens files themselves.
  //
  // `lib/stability.ts` is on this list deliberately and narrowly. Behind and Stuck are
  // the two states where money is genuinely at risk and where help is cheapest, which
  // is exactly the use the design contract reserves red for — and both carry a glyph
  // as well, so the meaning survives greyscale and colour blindness. The other three
  // tiers must not reach for it, and a check below holds them to that.
  //
  // Every entry is a file that exists and renders money at risk. Paths were removed
  // from this list once for being guesses at where a component might live: an
  // allowlist entry for a file that does not exist is a hole waiting to be filled by
  // whoever happens to create that path.
  const ALLOWED = [
    "app/globals.css",
    "lib/palette.ts",
    "lib/stability.ts",
    "components/ui/WarningCard.tsx",
    "components/ui/ArrearsNote.tsx",
    "components/ui/MoneyRow.tsx",
  ];
  const missing = ALLOWED.filter((f) => !existsSync(join(ROOT, f)));
  if (missing.length) {
    throw new Error(`allowlisted files that do not exist: ${missing.join(", ")}`);
  }
  const offenders = [];
  for (const file of sourceFiles()) {
    if (ALLOWED.includes(file)) continue;
    const text = readFileSync(join(ROOT, file), "utf8");
    if (/\bwarn(-tint)?\b/.test(text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""))) {
      offenders.push(file);
    }
  }
  if (offenders.length) {
    throw new Error(`warning colour referenced outside the allowlist: ${offenders.join(", ")}`);
  }
  return `${ALLOWED.length} files may spend it`;
});

check("only the two at-risk verdicts are painted red", () => {
  // The allowance granted to lib/stability.ts above, held to what it was granted for.
  const text = readFileSync(join(ROOT, "lib/stability.ts"), "utf8");
  const warn = [...text.matchAll(/(\w[\w-]*):\s*\{[\s\S]{0,600}?hex:\s*PALETTE\.(\w+)/g)];
  if (warn.length < 5) throw new Error(`read ${warn.length} verdict colours, expected five`);
  const red = warn.filter(([, , token]) => token === "warn").map(([, tier]) => tier).sort();
  const expected = ["behind", "trapped"];
  if (red.join(",") !== expected.join(",")) {
    throw new Error(`red verdicts are ${red.join(", ") || "(none)"}; only ${expected.join(" and ")} may be`);
  }
  return `${red.join(" and ")} only`;
});

console.log(`\n${checks - failures}/${checks} palette checks passed`);
process.exit(failures ? 1 : 0);
