// Can this be used by somebody who is not using it the way we imagined?
//
//   npm run build && node scripts/qa/a11y.mjs
//
// The audience for this product includes people on cheap phones with cracked screens in
// daylight, people whose reading is slow, people who zoom to 200% as a matter of course,
// and people who never touch a pointing device. None of that is an edge case here; a
// product about not being cheated that is hard to read is a product that cheats people.
//
// Everything below is measured in the real build. Nothing here is a checklist tick: each
// check fails with the element it found and what was wrong with it.
import { mkdirSync } from "fs";
import { join } from "path";
import { POISON, ROOT, VIEWPORTS, newPage, offendersOf, overflowOf, withServer } from "./browser.mjs";

const OUT = process.env.QA_SHOT_DIR ?? join(ROOT, ".shots");
mkdirSync(OUT, { recursive: true });

const problems = [];
const fail = (what) => {
  problems.push(what);
  console.log(`  FAIL ${what}`);
};
const ok = (what) => console.log(`  ok   ${what}`);

// ── Probes that run inside the page ─────────────────────────────────────────

/**
 * Controls a screen reader would announce as nothing at all.
 *
 * The accessible-name algorithm is longer than this, but every way it can produce a name
 * here is covered: own text, `aria-label`, `aria-labelledby`, a wrapping or associated
 * `<label>`, `title`. A control that has none of those announces as "button" and is a
 * dead end for anybody not looking at the screen.
 */
const NAMELESS = () => {
  const named = (el) => {
    const own = (el.textContent ?? "").trim();
    if (own) return true;
    if ((el.getAttribute("aria-label") ?? "").trim()) return true;
    const by = el.getAttribute("aria-labelledby");
    if (by && by.split(/\s+/).some((id) => (document.getElementById(id)?.textContent ?? "").trim())) {
      return true;
    }
    if ((el.getAttribute("title") ?? "").trim()) return true;
    const wrapping = el.closest("label");
    if ((wrapping?.textContent ?? "").trim()) return true;
    if (el.id) {
      const bound = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if ((bound?.textContent ?? "").trim()) return true;
    }
    return false;
  };
  const bad = [];
  for (const el of document.querySelectorAll("button, a[href], input, select, textarea")) {
    const box = el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    if (!named(el)) bad.push(`<${el.tagName.toLowerCase()}>${el.className ? ` .${String(el.className).split(" ")[0]}` : ""}`);
  }
  return bad.slice(0, 4);
};

/** One h1, and no level skipped on the way down. */
const HEADINGS = () => {
  const levels = [...document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")]
    .filter((el) => el.getBoundingClientRect().height > 0)
    .map((el) => ({ level: Number(el.tagName[1]), text: (el.textContent ?? "").trim().slice(0, 40) }));
  const ones = levels.filter((h) => h.level === 1).length;
  const skips = [];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i].level > levels[i - 1].level + 1) {
      skips.push(`h${levels[i - 1].level} → h${levels[i].level} at "${levels[i].text}"`);
    }
  }
  return { ones, skips, count: levels.length };
};

/**
 * Anything a finger has to hit. WCAG 2.2 2.5.8 asks 24×24; this product asks 48.
 *
 * What is measured is the area that actually activates the control, not the control's own
 * box. A radio inside a `<label>` is a 20px dot inside a 90px row, and the whole row
 * activates it — the first version of this check reported all nine choice rows in the
 * product as failures and would have had somebody "fix" a layout that was already right.
 * Measuring the wrong rectangle is worse than not measuring: it teaches people to
 * disbelieve the gate.
 */
const TARGETS = (floor) => {
  const bad = [];
  for (const el of document.querySelectorAll('button, a[href], input, [role="button"]')) {
    const hit = el.tagName === "INPUT" ? (el.closest("label") ?? el) : el;
    const box = hit.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    // An inline link inside a sentence is exempt in the standard, and rightly: giving it
    // 24px of height would break the line it sits in.
    if (el.tagName === "A" && getComputedStyle(el).display === "inline") continue;
    if (box.width < floor || box.height < floor) {
      bad.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 20)}" ${Math.round(box.width)}×${Math.round(box.height)}`);
    }
  }
  return bad.slice(0, 4);
};

/**
 * Colour is never the only channel.
 *
 * Every element painted in warning red has to carry a letter or one of ▲ ▬ ▼. A figure
 * in red and nothing else is invisible to a red-green reader, and washed out to anybody
 * reading in the sun — which is most of this audience most of the time.
 */
const COLOUR_ONLY = () => {
  const WARN = "rgb(180, 35, 24)";
  const bad = [];
  for (const el of document.querySelectorAll("main *")) {
    if (getComputedStyle(el).color !== WARN) continue;
    const text = (el.textContent ?? "").trim();
    if (!text) continue;
    // Only leaves: an ancestor painted red inherits to children, and reporting both
    // says the same thing twice.
    if ([...el.children].some((child) => getComputedStyle(child).color === WARN)) continue;
    // The currency mark is not a second channel. Testing for "any letter" made this
    // check incapable of failing on a money figure, because every money figure in this
    // product starts "HK$" — and money figures are the only thing that is ever red. The
    // check passed everything and proved nothing until a self-test caught it.
    const beyondTheNumber = text
      .replace(/HK\$/g, "")
      .replace(/[\d\s.,:%+()\u2013\u2014-]/g, "");
    if (/\p{L}/u.test(beyondTheNumber) || /[▲▬▼]/.test(beyondTheNumber)) continue;
    bad.push(`"${text.slice(0, 30)}" is red and nothing else`);
  }
  return bad.slice(0, 4);
};

/** Boxes whose content does not fit, at whatever size the text currently is. */
const CLIPPED = () => {
  const bad = [];
  for (const el of document.querySelectorAll("main *, nav *, header *")) {
    const style = getComputedStyle(el);
    if (style.overflow === "visible" && style.overflowX === "visible") continue;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      bad.push(`${el.tagName.toLowerCase()}: ${el.scrollWidth}px in ${el.clientWidth}px`);
    }
  }
  return bad.slice(0, 3);
};

/** Transitions that still run when the reader has asked for stillness. */
const MOVING = () => {
  const bad = [];
  for (const el of document.querySelectorAll("main *, nav *, header *")) {
    const style = getComputedStyle(el);
    const longest = [style.transitionDuration, style.animationDuration]
      .flatMap((value) => value.split(",").map((v) => Number.parseFloat(v) * (v.includes("ms") ? 1 : 1000)))
      .filter((n) => Number.isFinite(n));
    if (longest.some((ms) => ms > 10)) {
      bad.push(`${el.tagName.toLowerCase()} still moves for ${Math.max(...longest)}ms`);
    }
  }
  return bad.slice(0, 3);
};

// ── The walk ────────────────────────────────────────────────────────────────

/** Everything that is true of every screen, checked on every screen. */
async function audit(page, where, { floor = 48 } = {}) {
  const before = problems.length;

  const body = await page.locator("body").innerText();
  const poison = body.match(POISON);
  if (poison) fail(`${where}: prints "${poison[0]}"`);

  const nameless = await page.evaluate(NAMELESS);
  if (nameless.length) fail(`${where}: ${nameless.length} controls announce as nothing — ${nameless.join(", ")}`);

  const headings = await page.evaluate(HEADINGS);
  if (headings.ones !== 1) fail(`${where}: ${headings.ones} level-one headings, expected exactly one`);
  if (headings.skips.length) fail(`${where}: heading levels skip — ${headings.skips.join("; ")}`);

  const targets = await page.evaluate(TARGETS, floor);
  if (targets.length) fail(`${where}: targets under ${floor}px — ${targets.join(", ")}`);

  const colour = await page.evaluate(COLOUR_ONLY);
  if (colour.length) fail(`${where}: colour is the only signal — ${colour.join("; ")}`);

  if (problems.length === before) ok(where);
}

/** The same screen, read by somebody who needs it twice the size. */
async function atDoubleSize(page, where) {
  const before = problems.length;
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.waitForTimeout(120);
  const overflow = await overflowOf(page);
  if (overflow > 1) {
    fail(`${where} at 200%: ${overflow}px of horizontal overflow — ${(await offendersOf(page)).join(" · ")}`);
  }
  const clipped = await page.evaluate(CLIPPED);
  if (clipped.length) fail(`${where} at 200%: clipped — ${clipped.join("; ")}`);
  await page.screenshot({ path: join(OUT, `a11y-200-${where.replace(/\W+/g, "-")}.png`), fullPage: true });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.waitForTimeout(80);
  if (problems.length === before) ok(`${where} at 200% text`);
}

/**
 * Tab through a screen, and check that every stop can be seen.
 *
 * Stops are identified by a stamped index rather than by their text, because a radio and
 * a text field both have no text at all: the first version keyed on tag plus text, saw
 * "input:" twice in a row, decided the walk had wrapped around, and reported that one
 * control existed on a screen with nine. A check that miscounts is worse than no check —
 * it sends somebody looking for a bug in the product.
 *
 * What it asserts is completeness, not a count: every control with a box on the screen
 * has to be reachable, and every stop has to draw a ring somebody can see.
 */
async function focusWalk(page, where) {
  const before = problems.length;
  // Start from the top of the document, not from wherever the last click left focus.
  // Playwright's Tab continues from `document.activeElement`, and clicking a button that
  // then unmounts leaves focus partway down the page — so the first version of this walk
  // began at the third control on the screen and reported the two before it as missing.
  await page.evaluate(() => {
    document.querySelectorAll("[data-qa-focus]").forEach((el) => el.removeAttribute("data-qa-focus"));
    document
      .querySelectorAll("button, a[href], input, select, textarea, [tabindex]")
      .forEach((el, i) => el.setAttribute("data-qa-focus", String(i)));
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });

  const seen = new Set();
  const stops = [];
  const invisible = [];
  // Tab until three presses in a row turn up nothing new, rather than until the first
  // repeat. Chromium keeps its own "sequential focus navigation starting point" from the
  // last click, and `blur()` does not reset it — so a walk that began after a click
  // partway down the page started there, wrapped, and stopped at the first repeat with
  // the header still unvisited. It then reported the language control as unreachable by
  // keyboard, which was a defect in the walk and not in the product.
  let stale = 0;
  for (let i = 0; i < 60 && stale < 3; i++) {
    await page.keyboard.press("Tab");
    const here = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        id: el.getAttribute("data-qa-focus"),
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 24),
        outline: Number.parseFloat(style.outlineWidth) || 0,
        style: style.outlineStyle,
        shadow: style.boxShadow,
        onScreen: box.width > 0 && box.height > 0,
      };
    });
    // Focus falling out of the document is not the end of the walk: Chromium hands it to
    // browser chrome that is not there in headless, and the next press re-enters at the
    // top of the page. Treating that as the end is what made the header look unreachable.
    if (!here || here.id === null || seen.has(here.id)) {
      stale += 1;
      continue;
    }
    stale = 0;
    seen.add(here.id);
    stops.push(`<${here.tag}> "${here.text}"`);
    const ringed =
      (here.outline >= 2 && here.style !== "none") || (here.shadow && here.shadow !== "none");
    if (here.onScreen && !ringed) invisible.push(`<${here.tag}> "${here.text}"`);
  }

  // Everything on screen that a keyboard should be able to get to, and did not.
  // A radio group is one tab stop by design, so a radio whose group was reached counts
  // as reached: Tab moves between groups and the arrow keys move within, which is how
  // every native form behaves and what a keyboard user expects.
  const missed = await page.evaluate((reached) => {
    const got = new Set(reached);
    const groupsReached = new Set(
      [...document.querySelectorAll("input[type=radio][data-qa-focus]")]
        .filter((el) => got.has(el.getAttribute("data-qa-focus")))
        .map((el) => el.name),
    );
    const bad = [];
    for (const el of document.querySelectorAll("[data-qa-focus]")) {
      const id = el.getAttribute("data-qa-focus");
      if (got.has(id)) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (el.type === "radio" && groupsReached.has(el.name)) continue;
      bad.push(`<${el.tagName.toLowerCase()}> "${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 24)}"`);
    }
    return bad.slice(0, 4);
  }, [...seen]);

  if (missed.length) {
    fail(`${where}: ${missed.length} controls cannot be reached by keyboard — ${missed.join(", ")}`);
  }
  if (invisible.length) {
    fail(`${where}: focus is invisible on ${invisible.length} controls — ${invisible.join(", ")}`);
  }
  if (problems.length === before) ok(`${where}: ${seen.size} stops by keyboard, every one visibly focused`);
}

/** Into a live month, by keyboard where the point is the keyboard. */
async function intoMonth(page, base) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Start$/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole("radio", { name: /Maria/ }).check();
  await page.getByRole("button", { name: /^Start the year$/ }).click();
  await page.waitForTimeout(300);
}

/**
 * Before trusting the probes, break the page on purpose and watch each one fire.
 *
 * Every check in this file is a search for something that should not be there, and a
 * search that can never find anything reports a clean page forever. Two in this file were
 * already like that: the colour-only check tested for "any letter", which every `HK$`
 * figure satisfies, so it could not fail on the only thing that is ever painted red; and
 * the name check counted a wrapping `<label>` as a name even when the label was empty.
 * Both passed every screen in the product and proved nothing.
 *
 * So: inject one known-bad element per probe into a real page, and fail the run if the
 * probe stays quiet. It costs one page load and it is the only reason to believe the
 * fifteen "ok" lines below it.
 */
async function proveTheProbesWork(page) {
  const before = problems.length;
  const silent = [];

  await page.evaluate(() => {
    const main = document.querySelector("main");
    const red = document.createElement("span");
    red.style.color = "rgb(180, 35, 24)";
    red.textContent = "HK$ 4,100";
    red.id = "qa-self-red";
    const nameless = document.createElement("button");
    nameless.id = "qa-self-nameless";
    nameless.style.cssText = "width:60px;height:60px";
    const tiny = document.createElement("button");
    tiny.id = "qa-self-tiny";
    tiny.textContent = "x";
    tiny.style.cssText = "width:10px;height:10px;padding:0";
    const deep = document.createElement("h4");
    deep.id = "qa-self-deep";
    deep.textContent = "a level nobody asked for";
    main.append(red, nameless, tiny, deep);
  });

  if ((await page.evaluate(COLOUR_ONLY)).length === 0) silent.push("colour-only");
  if ((await page.evaluate(NAMELESS)).length === 0) silent.push("nameless controls");
  if ((await page.evaluate(TARGETS, 48)).length === 0) silent.push("target size");
  if ((await page.evaluate(HEADINGS)).skips.length === 0) silent.push("heading order");

  await page.evaluate(() => {
    for (const id of ["qa-self-red", "qa-self-nameless", "qa-self-tiny", "qa-self-deep"]) {
      document.getElementById(id)?.remove();
    }
  });

  if (silent.length) fail(`probes that did not fire on a deliberately broken page: ${silent.join(", ")}`);
  if (problems.length === before) ok("every probe fires on a page broken on purpose");
}

await withServer(async ({ browser, base }) => {
  const page = await newPage(browser, VIEWPORTS.phone);

  await page.goto(base, { waitUntil: "networkidle" });
  await proveTheProbesWork(page);

  const lang = await page.evaluate(() => document.documentElement.lang);
  if (!lang) fail("the page never says what language it is in");
  else ok(`the page declares itself as "${lang}"`);

  await audit(page, "title");
  await atDoubleSize(page, "title");

  await page.getByRole("button", { name: /^Start$/ }).click();
  await page.waitForTimeout(250);
  await audit(page, "pick a life");
  await atDoubleSize(page, "pick a life");

  await focusWalk(page, "pick a life");

  await intoMonth(page, base);
  await focusWalk(page, "the month");
  await audit(page, "month");
  await atDoubleSize(page, "month");

  // The borrow sheet, opened and left without deciding anything — by keyboard only.
  const borrow = page.getByRole("button", { name: /^Borrow money$/ });
  if ((await borrow.count()) === 0) {
    fail("no way to reach the borrow sheet");
  } else {
    await borrow.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest("dialog")));
    if (!inside) fail("opening the borrow sheet leaves focus behind it");
    const exits = await page.getByRole("button", { name: /^Not now$/ }).count();
    if (exits === 0) fail("the borrow sheet has no visible way out");
    await audit(page, "borrow sheet");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const closed = await page.evaluate(() => !document.querySelector("dialog[open]"));
    if (!closed) fail("Escape does not close the borrow sheet");
    if (inside && exits > 0 && closed) ok("the borrow sheet takes focus, shows a way out, and Escape closes it");
  }

  // Help, which is where somebody in trouble arrives.
  await page.getByRole("button", { name: /^Help$/ }).first().click();
  await page.waitForTimeout(250);
  await audit(page, "help");
  await atDoubleSize(page, "help");

  // Reflow: WCAG 2.2 1.4.10 asks for no sideways scrolling at 320 CSS pixels.
  const narrow = await newPage(browser, { width: 320, height: 640 });
  await intoMonth(narrow, base);
  const overflow = await overflowOf(narrow);
  if (overflow > 1) fail(`320px: ${overflow}px of horizontal overflow — ${(await offendersOf(narrow)).join(" · ")}`);
  else ok("nothing scrolls sideways at 320px");
  // 24×24 is the standard's floor; a phone at 320px is where this product's own 48
  // would be most tempting to break.
  const tiny = await narrow.evaluate(TARGETS, 24);
  if (tiny.length) fail(`320px: targets under 24px — ${tiny.join(", ")}`);
  else ok("every target clears 24px at 320px");
  await narrow.close();

  // Reduced motion means still, not slower.
  const still = await newPage(browser, VIEWPORTS.phone, { reducedMotion: "reduce" });
  await intoMonth(still, base);
  const moving = await still.evaluate(MOVING);
  if (moving.length) fail(`reduced motion: ${moving.join("; ")}`);
  else ok("reduced motion stops everything, rather than slowing it");
  await still.close();

  if (page.qaErrors.length) fail(`browser console: ${page.qaErrors[0]}`);
});

console.log(
  problems.length === 0
    ? `\na11y: names, headings, focus, targets, zoom, reflow and stillness all hold`
    : `\n${problems.length} accessibility failures`,
);
process.exit(problems.length === 0 ? 0 : 1);
