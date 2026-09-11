// Screenshots, at the two widths this product is read on.
//
//   node scripts/qa/shot.mjs [path] [outDir]
//
// Boots the production build, loads a route at phone and computer widths, and writes
// a PNG for each. It also fails on any text the app should never print — a missing
// number rendering as "NaN" or a bare dollar sign where "HK$" belongs.
import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createServer } from "net";
import { chromium } from "playwright";

/**
 * The browser binary.
 *
 * CI images and this development container ship Chromium at a fixed path and do not
 * let Playwright download its own. `CHROMIUM_PATH` (or the standard
 * `PLAYWRIGHT_BROWSERS_PATH` layout) points at it; without either, Playwright falls
 * back to whatever it manages itself.
 */
const EXECUTABLE = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ROUTE = process.argv[2] ?? "/";
const OUT = process.argv[3] ?? join(ROOT, ".shots");
/**
 * A port nobody else is on.
 *
 * A fixed port looks tidier and fails the moment two checks overlap, or a previous
 * run leaves a server behind — which is exactly when a screenshot gate matters.
 */
const PORT = await freePort();

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/** Text no screen may ever contain. A bare `$` means a figure escaped `hkd()`. */
const POISON = /NaN|undefined|\[object |Infinity|(?<!HK)\$\s?\d/;

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "computer", width: 1280, height: 800 },
];

mkdirSync(OUT, { recursive: true });

const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, stdio: "pipe" });
let serverLog = "";
const ready = new Promise((resolve, reject) => {
  const timer = setTimeout(
    () => reject(new Error(`next start did not become ready:\n${serverLog}`)),
    60000,
  );
  const watch = (chunk) => {
    serverLog += String(chunk);
    if (serverLog.includes("Ready") || serverLog.includes("started server")) {
      clearTimeout(timer);
      resolve();
    }
  };
  server.stdout.on("data", watch);
  server.stderr.on("data", watch);
  server.on("exit", (code) => reject(new Error(`next start exited with ${code}:\n${serverLog}`)));
});

let failed = false;
try {
  await ready;
  const browser = await chromium.launch(
    existsSync(EXECUTABLE) ? { executablePath: EXECUTABLE } : {},
  );
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`http://127.0.0.1:${PORT}${ROUTE}`, { waitUntil: "networkidle" });
    const file = join(OUT, `${ROUTE.replace(/\W+/g, "_") || "home"}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });

    const body = await page.locator("body").innerText();
    const poison = body.match(POISON);
    if (poison) {
      console.log(`  FAIL ${vp.name}: page prints "${poison[0]}"`);
      failed = true;
    }

    // A page that scrolls sideways is a page somebody reads half of.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) {
      console.log(`  FAIL ${vp.name}: ${overflow}px of horizontal overflow`);
      failed = true;
    }

    console.log(`  ok   ${vp.name} ${vp.width}px → ${file}`);
    await page.close();
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}

process.exit(failed ? 1 : 0);
