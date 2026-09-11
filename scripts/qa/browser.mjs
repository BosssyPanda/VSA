// Booting the real build in a real browser, once, for every gate that needs one.
//
// This used to live inside `shot.mjs`. It moved here the moment a second gate needed
// it, because the alternative is three copies of the server-boot dance and three
// different ideas of what "ready" means — and the copy that drifts is always the one
// guarding the thing you care about.
import { spawn } from "child_process";
import { existsSync } from "fs";
import { createServer } from "net";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The browser binary.
 *
 * This container ships Chromium at a fixed path and does not let Playwright download
 * its own, and the version Playwright wants and the version installed do not have to
 * match. `CHROMIUM_PATH` overrides; without either, Playwright uses what it manages.
 */
export const EXECUTABLE = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

/**
 * Text no screen may ever contain.
 *
 * A bare `$` is in here because this is a Hong Kong product: `$100` is ambiguous
 * between HK$ and US$ to exactly the readers who can least afford the confusion, so
 * every figure goes through `hkd()` and prints `HK$`.
 */
export const POISON = /NaN|undefined|\[object |Infinity|(?<!HK)\$\s?\d/;

export const VIEWPORTS = {
  phone: { name: "phone", width: 390, height: 844 },
  small: { name: "small", width: 360, height: 740 },
  tablet: { name: "tablet", width: 768, height: 1024 },
  computer: { name: "computer", width: 1280, height: 800 },
};

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

/**
 * Run `fn` against a freshly started production build, then shut it down.
 *
 * A free port rather than a fixed one: a fixed port looks tidier right up until two
 * gates overlap or a previous run leaves a server behind, which is precisely when a
 * gate matters. The server's stdout AND stderr both feed the readiness check, because
 * a start-up failure that only prints to stderr otherwise shows up as a timeout with
 * no explanation.
 */
export async function withServer(fn) {
  const port = await freePort();
  const server = spawn("npx", ["next", "start", "-p", String(port)], { cwd: ROOT, stdio: "pipe" });
  let log = "";

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`next start never became ready:\n${log}`)), 60_000);
    const watch = (chunk) => {
      log += String(chunk);
      if (log.includes("Ready") || log.includes("started server")) {
        clearTimeout(timer);
        resolve();
      }
    };
    server.stdout.on("data", watch);
    server.stderr.on("data", watch);
    server.on("exit", (code) => reject(new Error(`next start exited with ${code}:\n${log}`)));
  });

  try {
    await ready;
    const browser = await chromium.launch(existsSync(EXECUTABLE) ? { executablePath: EXECUTABLE } : {});
    try {
      return await fn({ browser, base: `http://127.0.0.1:${port}` });
    } finally {
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
}

/** A page that also records console errors and page errors, so a gate can fail on them. */
export async function newPage(browser, viewport, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => errors.push(`PAGEERROR: ${(e.message ?? String(e)).slice(0, 300)}`));
  page.qaErrors = errors;
  return page;
}

/** Horizontal overflow, in pixels. A page that scrolls sideways is a page half-read. */
export function overflowOf(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/**
 * What is making the page wider than the screen, in its own words.
 *
 * "149px of horizontal overflow" says a screen is broken and nothing about which part,
 * and the reflex it produces is to open devtools and repeat the whole journey by hand.
 *
 * Two different things widen a page and only one of them has a box you can measure. A
 * card that sticks out has a rect past the edge. A line of text that will not wrap does
 * not: the element is still the width its parent allows, and the text spills out of it,
 * which shows up as `scrollWidth` past `clientWidth` and in no rectangle at all. The
 * first version of this helper only looked at rects, reported "(none)" against a real
 * 149px overflow, and sent the search off in the wrong direction for an hour. Both are
 * checked here, and only the deepest offender in any branch is named, because every
 * ancestor of a spilling line spills too.
 */
export function offendersOf(page, limit = 3) {
  return page.evaluate((max) => {
    const edge = document.documentElement.clientWidth;
    const flagged = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      const sticksOut = r.width > 0 && (r.right > edge + 1 || r.left < -1);
      // A pane that is meant to scroll sideways — a wide table, say — is not a fault.
      const scrollable = /auto|scroll|hidden/.test(getComputedStyle(el).overflowX);
      const spills = !scrollable && el.scrollWidth > el.clientWidth + 1;
      if (sticksOut || spills) flagged.push({ el, over: Math.max(Math.round(r.right - edge), el.scrollWidth - el.clientWidth) });
    }
    return flagged
      .filter(({ el }) => !flagged.some((other) => other.el !== el && el.contains(other.el)))
      .sort((a, b) => b.over - a.over)
      .slice(0, max)
      .map(({ el, over }) => {
        const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
        return `<${el.tagName.toLowerCase()}> ${over}px over: "${text}"`;
      });
  }, limit);
}
