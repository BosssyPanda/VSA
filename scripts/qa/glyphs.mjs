// No glyph in this product may render as a colour emoji.
//
//   node scripts/qa/glyphs.mjs
//
// The design contract gives colour exactly two meanings — accent is "the safe thing to
// do next", warn is "this could cost you money" — and a glyph that the platform decides
// to paint as a colour emoji introduces a third meaning that nobody chose. It also
// breaks "minimal icons": a flat ▤ and a glossy blue-and-white telephone are not the
// same design.
//
// This is not hypothetical. `☎` (U+260E) rendered as text in Chromium on Linux and as a
// colour emoji the moment the same character was set in Public Sans on another platform,
// which is how it was caught. Unicode gives it Emoji=Yes and Emoji_Presentation=No, so
// text is only the *default* — fonts and platforms override it freely. The fix is the
// variation selector U+FE0E, which asks for text presentation explicitly.
//
// ASCII digits, `#` and `*` also carry Emoji=Yes because they are keycap bases. They are
// only emoji when followed by U+20E3, so they are excluded rather than flagged.
import { readFileSync, readdirSync, statSync } from "fs";
import { dirname, extname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIRS = ["app", "components", "lib", "hooks", "content", "messages"];
const EXT = new Set([".ts", ".tsx", ".json"]);

const EMOJI_CAPABLE = /\p{Emoji}/u;
const KEYCAP_BASE = /[0-9#*]/;
const TEXT_PRESENTATION = "︎";

function* files(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* files(full);
    else if (EXT.has(extname(full))) yield full;
  }
}

const problems = [];
for (const dir of DIRS) {
  for (const file of files(join(ROOT, dir))) {
    const source = readFileSync(file, "utf8");
    const lines = source.split("\n");
    lines.forEach((line, i) => {
      const chars = [...line];
      chars.forEach((ch, j) => {
        if (ch.codePointAt(0) < 0x80) return;
        if (KEYCAP_BASE.test(ch)) return;
        if (!EMOJI_CAPABLE.test(ch)) return;
        // Already asking for text presentation, or already escaped as ︎.
        if (chars[j + 1] === TEXT_PRESENTATION) return;
        if (line.slice(line.indexOf(ch) + 1).startsWith("\\uFE0E")) return;
        problems.push(
          `${file.replace(ROOT + "/", "")}:${i + 1}  ${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}) may render as a colour emoji — append \\uFE0E`,
        );
      });
    });
  }
}

if (problems.length) {
  for (const p of problems) console.log(`  FAIL ${p}`);
  console.log(`\n${problems.length} glyphs may render in colour`);
  process.exit(1);
}
console.log("  ok   no glyph can render as a colour emoji");
