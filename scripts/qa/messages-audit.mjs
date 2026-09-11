// The message catalogue gate.
//
//   node scripts/qa/messages-audit.mjs [--write]
//
// Three things go wrong with translation files, and all three are silent:
//   1. A key is used in code but exists in no catalogue, so a player sees "card.why".
//   2. A key lingers in the catalogue after its screen is gone, so translators spend
//      their time on strings nobody reads.
//   3. A locale is offered in the picker before it is finished, so a screen comes out
//      half in one language.
//
// `messages/status.json` is what the language picker reads, so it is generated here
// and checked here. Stale status fails the build rather than shipping a half-translated
// locale to somebody who chose it in good faith.
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { engineDir } from "./build-engine.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WRITE = process.argv.includes("--write");
const LOCALES = ["en", "tl", "id"];

const catalogues = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(readFileSync(join(ROOT, `messages/${l}.json`), "utf8"))]),
);
const enKeys = Object.keys(catalogues.en);

let failures = 0;
const fail = (message) => {
  failures++;
  console.log(`  FAIL ${message}`);
};

// ── Keys used in code ───────────────────────────────────────────────────────
const files = [];
function walk(dir) {
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
    else if (/\.tsx?$/.test(entry)) files.push(rel);
  }
}
for (const d of ["app", "components", "lib"]) walk(d);

const used = new Map();
/**
 * Keys built from a value: `t(`tier.${id}.title`)`.
 *
 * These are real uses and the audit has to see them, or every key a screen reaches
 * through a variable looks like an orphan — and the fix somebody reaches for then is an
 * exemption list, which is a hole rather than a check. Instead the template is read as
 * a pattern, `tier.*.title`, and both directions still hold: a pattern that matches no
 * catalogue key fails (so a typo in the prefix is caught), and a catalogue key matched
 * by no static key and no pattern fails (so a dead string is still caught).
 */
const patterns = new Map();

function patternToRegExp(pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, "[^.]+");
  return new RegExp(`^${escaped}$`);
}

for (const file of files) {
  const text = readFileSync(join(ROOT, file), "utf8");
  for (const [, key] of text.matchAll(/\bt\(\s*"([a-z][\w.]*)"/gi)) {
    if (!used.has(key)) used.set(key, file);
  }
  for (const [, key] of text.matchAll(/\btn\(\s*"([a-z][\w.]*)"/gi)) {
    if (!used.has(key)) used.set(key, file);
  }
  for (const [, raw] of text.matchAll(/\btn?\(\s*`([^`]*\$\{[^`]*)`/g)) {
    const pattern = raw.replace(/\$\{[^}]*\}/g, "*");
    if (!/^[a-z][\w.*-]*$/i.test(pattern)) continue;
    if (!patterns.has(pattern)) patterns.set(pattern, file);
  }
}

for (const [key, file] of used) {
  // A counted string is written `key.one` / `key.other`; either one proves it exists.
  const present = enKeys.includes(key) || enKeys.some((k) => k.startsWith(`${key}.`));
  if (!present) fail(`${file} uses "${key}", which is in no catalogue`);
}

const patternMatchers = [...patterns].map(([pattern, file]) => ({
  pattern,
  file,
  re: patternToRegExp(pattern),
}));

for (const { pattern, file, re } of patternMatchers) {
  const matches = enKeys.filter((k) => re.test(k) || re.test(k.replace(/\.(one|other|few|many|zero|two)$/, "")));
  if (matches.length === 0) fail(`${file} builds "${pattern}", which matches nothing in the catalogue`);
}

for (const key of enKeys) {
  const base = key.replace(/\.(one|other|few|many|zero|two)$/, "");
  if (used.has(key) || used.has(base)) continue;
  if (patternMatchers.some(({ re }) => re.test(key) || re.test(base))) continue;
  fail(`messages/en.json has "${key}", which no screen uses`);
}

// ── The words the engine carries, and the words the screen shows ────────────
//
// Four registries in `lib/` hold English prose next to the data that justifies it: a
// help line's `what` sits beside the page it was read off and the date it was read, a
// fact's label beside its source, a tier's blurb beside the rule that awards it. That
// co-location is worth keeping — a sentence about what a hotline does is only checkable
// next to the hotline's own page — but it means the same sentence exists twice, once
// for the headless gates and once for the screen, and two copies drift.
//
// They have drifted twice already. `helpLine.basic-housing.org` was renamed in the
// engine and not in the catalogue, so the Sources page and the Help page named the same
// government line differently. `tier.tight.blurb` was rewritten in the catalogue during
// the plain-words pass and not in the engine, so the screen and the share text
// disagreed about what Tight means.
//
// So: they must be identical, character for character. Whichever side is right, the
// other is edited to match before this passes.
const require_ = createRequire(import.meta.url);
const engine = (mod) => require_(`${engineDir()}/lib/${mod}.js`);

const { HELP_LINE_IDS, helpLine } = engine("helpLines");
const { FACTS } = engine("facts");
const { PERSONA_IDS, getPersona } = engine("personas");
const { VERDICTS } = engine("stability");

const before = failures;

/** `optional` marks a field the engine is allowed to leave out, like a help line's note. */
const engineStrings = [];
const carries = (key, text, optional = false) => engineStrings.push({ key, text, optional });

for (const id of HELP_LINE_IDS) {
  const line = helpLine(id);
  carries(`helpLine.${id}.org`, line.org);
  carries(`helpLine.${id}.what`, line.what);
  carries(`helpLine.${id}.hours`, line.hours, true);
  carries(`helpLine.${id}.note`, line.note, true);
}
for (const [id, fact] of Object.entries(FACTS)) carries(`fact.${id}.label`, fact.label);
for (const id of PERSONA_IDS) {
  const persona = getPersona(id);
  carries(`persona.${id}.name`, persona.name);
  carries(`persona.${id}.blurb`, persona.blurb);
}
for (const [tier, verdict] of Object.entries(VERDICTS)) {
  carries(`tier.${tier}.title`, verdict.title);
  carries(`tier.${tier}.blurb`, verdict.blurb);
}

for (const { key, text, optional } of engineStrings) {
  const shown = catalogues.en[key];
  if (text === undefined) {
    if (shown !== undefined) {
      fail(`messages/en.json has "${key}", which the engine no longer carries`);
    }
    continue;
  }
  if (shown === undefined) {
    const where = optional ? "an optional field" : "a required field";
    fail(`messages/en.json has no "${key}" (${where}) — the engine says: ${text}`);
  } else if (shown !== text) {
    fail(`"${key}" has drifted\n       engine:    ${text}\n       catalogue: ${shown}`);
  }
}
if (failures === before) {
  console.log(`  ok   ${engineStrings.filter((s) => s.text !== undefined).length} strings say what the engine says`);
}

// ── Per-locale coverage ─────────────────────────────────────────────────────
const status = {};
for (const locale of LOCALES) {
  const catalogue = catalogues[locale];
  const translated = enKeys.filter(
    (k) => typeof catalogue[k] === "string" && catalogue[k].trim() !== "",
  ).length;
  const orphans = Object.keys(catalogue).filter((k) => !enKeys.includes(k));
  if (orphans.length) fail(`messages/${locale}.json has keys English does not: ${orphans.join(", ")}`);
  status[locale] = { keys: enKeys.length, translated, complete: translated === enKeys.length };
  console.log(
    `  ${status[locale].complete ? "ok  " : "note"} ${locale}: ${translated}/${enKeys.length} translated` +
      (status[locale].complete ? "" : " — hidden from the language picker"),
  );
}

// ── status.json must match what we just computed ────────────────────────────
const statusPath = join(ROOT, "messages/status.json");
const serialised = JSON.stringify(status, null, 2) + "\n";
if (WRITE) {
  writeFileSync(statusPath, serialised);
  console.log("  ok   wrote messages/status.json");
} else if (readFileSync(statusPath, "utf8") !== serialised) {
  fail("messages/status.json is stale — run `node scripts/qa/messages-audit.mjs --write`");
}

if (failures) {
  console.log(`\n${failures} message problems`);
  process.exit(1);
}
console.log(`  ok   ${enKeys.length} keys, ${used.size} used in code`);
