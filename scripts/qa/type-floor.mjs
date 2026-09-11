// The type-size floor.
//
//   node scripts/qa/type-floor.mjs
//
// DESIGN.md sets a hard floor of 14px on every piece of text in this product. The
// reason is the audience: a person reading a cheap phone in daylight, often not in
// their first language, often while worried. LifePatch had 86 instances of text below
// 11px and every one of them was a decision made for density over legibility.
//
// This also bans tracked uppercase, which is a display style that costs ~10% reading
// speed and breaks outright on the long compound words Tagalog and Bahasa Indonesia
// produce.
import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FLOOR_PX = 14;

const files = [];
function walk(dir) {
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
    else if (/\.(tsx?|css)$/.test(entry)) files.push(rel);
  }
}
for (const d of ["app", "components"]) walk(d);

const problems = [];

/** Tailwind's own steps, in px. Anything below the floor is refused by name. */
const TW_SIZES = { "text-xs": 12, "text-sm": 14, "text-base": 16, "text-lg": 18, "text-xl": 20 };

for (const file of files) {
  const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`;
    const code = line.replace(/\/\/.*$/, "");

    for (const [cls, px] of Object.entries(TW_SIZES)) {
      if (px < FLOOR_PX && new RegExp(`\\b${cls}\\b`).test(code)) {
        problems.push(`${at}  ${cls} is ${px}px, floor is ${FLOOR_PX}px`);
      }
    }

    // Arbitrary values: text-[13px], text-[0.75rem], font-size: 12px
    for (const [, value, unit] of code.matchAll(/(?:text-\[|font-size:\s*)([\d.]+)(px|rem)/g)) {
      const px = unit === "rem" ? Number(value) * 16 : Number(value);
      if (px < FLOOR_PX) problems.push(`${at}  ${value}${unit} is ${px}px, floor is ${FLOOR_PX}px`);
    }

    // Tracked uppercase — the LEDGER habit this product does not inherit.
    if (/\buppercase\b/.test(code) && /\btracking-/.test(code)) {
      problems.push(`${at}  tracked uppercase is not used in this product`);
    }
  });
}

// The tokens themselves must respect the floor, or every component inherits a breach.
const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
for (const [, name, value, unit] of css.matchAll(/--text-([a-z-]+):\s*([\d.]+)(rem|px);/g)) {
  const px = unit === "rem" ? Number(value) * 16 : Number(value);
  if (px < FLOOR_PX) problems.push(`app/globals.css  --text-${name} is ${px}px, floor is ${FLOOR_PX}px`);
}

if (problems.length) {
  console.log(problems.map((p) => `  FAIL ${p}`).join("\n"));
  console.log(`\n${problems.length} type-floor violations across ${files.length} files`);
  process.exit(1);
}
console.log(`  ok   no text below ${FLOOR_PX}px, no tracked uppercase  (${files.length} files)`);
