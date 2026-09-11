// Every word on screen comes from the message catalogue.
//
//   node scripts/qa/no-literals.mjs
//
// A hardcoded string is a string that cannot be translated, which in this product
// means a screen that switches to Tagalog with an English sentence still on it. That
// is worse for a low-literacy reader than staying in English throughout, so the rule
// is absolute rather than a preference — and it is checked with the TypeScript
// parser rather than a regex, because a regex over JSX is a source of false comfort.
import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Attributes that are read aloud by a screen reader and therefore need translating. */
const SPOKEN_ATTRS = new Set(["aria-label", "aria-description", "alt", "title", "placeholder"]);

const files = [];
function walk(dir) {
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
    else if (entry.endsWith(".tsx")) files.push(rel);
  }
}
for (const d of ["app", "components"]) walk(d);

const problems = [];
const hasLetter = /\p{L}{2,}/u;

for (const file of files) {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(ROOT, file), "utf8"),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX,
  );

  const report = (node, message) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    problems.push(`${file}:${line + 1}  ${message}`);
  };

  const visit = (node) => {
    if (ts.isJsxText(node) && hasLetter.test(node.text)) {
      report(node, `text "${node.text.trim().slice(0, 40)}" should come from t()`);
    }
    if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText(source);
      const init = node.initializer;
      const literal = ts.isStringLiteral(init)
        ? init
        : ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)
          ? init.expression
          : null;
      if (literal && SPOKEN_ATTRS.has(name) && hasLetter.test(literal.text)) {
        report(node, `${name}="${literal.text.slice(0, 40)}" should come from t()`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (problems.length) {
  console.log(problems.map((p) => `  FAIL ${p}`).join("\n"));
  console.log(`\n${problems.length} hardcoded strings across ${files.length} files`);
  process.exit(1);
}
console.log(`  ok   no hardcoded player-facing strings  (${files.length} files)`);
