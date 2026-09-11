// Compile the engine to plain JS so a Node script can drive it headless.
//
//   node scripts/qa/build-engine.mjs   →  /tmp/monthend-engine/lib/*.js
//
// Everything under `lib/` is pure: no React, no DOM, no clock, no globals. That is not
// an accident of how it was written, it is the thing that makes the properties in
// engine-props.mjs possible at all — two thousand runs of a twelve-month game is a
// second of CPU and a browser-free process.
//
// Output is CommonJS into a directory with no package.json, so Node resolves the
// extensionless relative requires that tsc emits. `@/…` specifiers are rewritten to
// real relative paths on the way out, because tsc resolves that alias for TYPES only
// and emits the specifier untouched.
import { execFileSync } from "child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "fs";
import path from "path";

export const OUT = process.env.QA_ENGINE_OUT ?? "/tmp/monthend-engine";
const ROOT = process.cwd();

/** Engine entry points. Anything importing React, next/* or the browser stays out. */
const ENTRIES = [
  "lib/rng.ts",
  "lib/format.ts",
  "lib/palette.ts",
  "lib/facts.ts",
  "lib/concepts.ts",
  "lib/mpf.ts",
  "lib/income.ts",
  "lib/costs.ts",
  "lib/debt.ts",
  "lib/personas.ts",
  "lib/cards.ts",
  "lib/stability.ts",
  "lib/monthEngine.ts",
  "lib/replay.ts",
  "lib/report.ts",
];

/** Directories the rewrite and the staleness check walk. `content/` is engine source. */
const TREES = ["lib", "content"];

function walk(dir, ext, out = []) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

export function buildEngine({ extra = [] } = {}) {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const cfg = path.join(OUT, "tsconfig.build.json");
  writeFileSync(
    cfg,
    JSON.stringify({
      compilerOptions: {
        target: "es2022",
        module: "commonjs",
        moduleResolution: "node",
        rootDir: ROOT,
        outDir: OUT,
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        // `lib/concepts.ts` reads process.env.NODE_ENV. The config file lives in OUT,
        // so tsc would otherwise look for @types beside it and find nothing.
        types: ["node"],
        typeRoots: [path.join(ROOT, "node_modules/@types")],
        // Types only — the emitted specifier keeps the alias, hence the rewrite below.
        baseUrl: ROOT,
        paths: { "@/*": ["./*"] },
      },
      files: [...ENTRIES, ...extra].map((f) => path.join(ROOT, f)),
    }),
    "utf8",
  );

  execFileSync("npx", ["tsc", "-p", cfg], { stdio: "inherit", cwd: ROOT });

  // The compiled tree lives outside the repo, so Node cannot walk up to node_modules.
  try {
    symlinkSync(path.join(ROOT, "node_modules"), path.join(OUT, "node_modules"), "junction");
  } catch {}

  for (const tree of TREES) {
    for (const file of walk(path.join(OUT, tree), ".js")) {
      const src = readFileSync(file, "utf8");
      const fixed = src.replace(/require\("@\/([^"]+)"\)/g, (_m, spec) => {
        let rel = path.relative(path.dirname(file), path.join(OUT, spec)).split(path.sep).join("/");
        if (!rel.startsWith(".")) rel = `./${rel}`;
        return `require("${rel}")`;
      });
      if (fixed !== src) writeFileSync(file, fixed, "utf8");
    }
  }
  return OUT;
}

/**
 * The compiled engine, rebuilt when the source has moved past it.
 *
 * Every consumer calls this rather than requiring straight out of OUT. A script that
 * requires a directory it never built runs against whatever is left in /tmp from an
 * earlier build — and a gate reporting PASS on three-hour-old code is worse than no
 * gate, because it is trusted. mtime rather than an unconditional rebuild, so a
 * browser journey does not pay for a tsc run to open a page.
 */
let resolved = null;

function newestMtime(dir, ext) {
  let t = 0;
  for (const file of walk(dir, ext)) t = Math.max(t, statSync(file).mtimeMs);
  return t;
}

export function engineDir() {
  if (resolved) return resolved;
  const src = Math.max(...TREES.map((tree) => newestMtime(path.join(ROOT, tree), ".ts")));
  const out = Math.max(...TREES.map((tree) => newestMtime(path.join(OUT, tree), ".js")));
  if (src === 0 || out === 0 || src > out) buildEngine();
  resolved = OUT;
  return OUT;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildEngine();
  console.log(`engine → ${OUT}/lib`);
}
