// What happens when the words get longer.
//
//   npm run build && node scripts/qa/i18n-expand.mjs
//
// Tagalog and Bahasa Indonesia run roughly a third longer than English, and that is the
// most common way a translated interface breaks: a label that fitted in English clips,
// a button's text spills, a row goes sideways. Finding that after the translators have
// been paid is expensive and, worse, it lands on the readers who can least afford a
// half-legible screen.
//
// So every string on screen is grown 35% in the browser and the layout is measured. The
// plumbing is the messages audit's job; this is about whether the boxes survive.
import { mkdirSync } from "fs";
import { join } from "path";
import { ROOT, VIEWPORTS, newPage, overflowOf, withServer } from "./browser.mjs";

const OUT = process.env.QA_SHOT_DIR ?? join(ROOT, ".shots");
mkdirSync(OUT, { recursive: true });

const problems = [];
const fail = (what) => {
  problems.push(what);
  console.log(`  FAIL ${what}`);
};
const ok = (what) => console.log(`  ok   ${what}`);

/**
 * Grow every visible word by about a third, in place — and remember how to undo it.
 *
 * Text nodes only, so structure and classes are untouched — this measures the layout
 * under longer words, not under different markup. Padding is added inside each word
 * rather than as extra words, because a long unbreakable word is the case that actually
 * breaks a button, and compound words are exactly what Bahasa Indonesia produces.
 *
 * WHY IT UNDOES ITSELF. The first version of this gate expanded the page and then went
 * looking for `Start the year` to click, which by then read `Startāā theāā yearāā` — so
 * the walk through the product died on a thirty-second Playwright timeout at the second
 * screen, and the three screens after it were never measured at all. Every screen is
 * still measured expanded; the text is put back before anything is clicked, so the walk
 * uses the same English labels as every other browser gate. The alternative — seeding
 * `data-testid` through the components — puts test scaffolding into the product to work
 * around a defect in the test.
 */
const EXPAND = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const saved = [];
  for (const node of nodes) {
    const text = node.nodeValue;
    if (!text || !/\p{L}{2,}/u.test(text)) continue;
    const grown = text.replace(/\p{L}{3,}/gu, (word) => {
      const extra = Math.max(1, Math.round(word.length * 0.35));
      return word + "ā".repeat(extra);
    });
    if (grown === text) continue;
    saved.push([node, text]);
    node.nodeValue = grown;
  }
  window.__qaExpanded = saved;
  return saved.length;
};

const RESTORE = () => {
  for (const [node, text] of window.__qaExpanded ?? []) {
    if (node.isConnected) node.nodeValue = text;
  }
  window.__qaExpanded = [];
};

/** Boxes whose content does not fit inside them. */
const CLIPPED = () => {
  const bad = [];
  for (const el of document.querySelectorAll("main *, nav *")) {
    const style = getComputedStyle(el);
    if (style.overflow === "visible" && style.overflowX === "visible") continue;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      bad.push(`${el.tagName.toLowerCase()}: ${el.scrollWidth}px in ${el.clientWidth}px`);
    }
    if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0 && style.overflowY === "hidden") {
      bad.push(`${el.tagName.toLowerCase()}: text cut off vertically`);
    }
  }
  return bad.slice(0, 4);
};

async function check(page, where) {
  const grown = await page.evaluate(EXPAND);
  if (grown === 0) fail(`${where}: nothing on screen grew — the gate measured nothing`);
  await page.waitForTimeout(80);
  const overflow = await overflowOf(page);
  if (overflow > 1) fail(`${where}: ${overflow}px of horizontal overflow with longer words`);
  const clipped = await page.evaluate(CLIPPED);
  if (clipped.length) fail(`${where}: clipped — ${clipped.join("; ")}`);
  if (grown > 0 && overflow <= 1 && clipped.length === 0) ok(where);
  await page.screenshot({ path: join(OUT, `i18n-${where.replace(/\W+/g, "-")}.png`), fullPage: true });
  await page.evaluate(RESTORE);
  await page.waitForTimeout(40);
}

/**
 * Click a button by its English label, or say plainly which one was missing.
 *
 * Playwright's own failure here is a thirty-second timeout and a stack trace, which
 * reads like an infrastructure problem and is almost always a copy change instead.
 */
async function press(page, re, what) {
  const button = page.getByRole("button", { name: re });
  if ((await button.count()) === 0) {
    fail(`no button matching ${re} to reach ${what}`);
    return false;
  }
  await button.first().click();
  return true;
}

await withServer(async ({ browser, base }) => {
  const page = await newPage(browser, { width: VIEWPORTS.small.width, height: VIEWPORTS.small.height });

  await page.goto(base, { waitUntil: "networkidle" });
  await check(page, "title");

  if (!(await press(page, /^Start/, "pick a life"))) return;
  await page.waitForTimeout(200);
  await check(page, "pick a life");

  if (!(await press(page, /Maria/, "Maria's year"))) return;
  if (!(await press(page, /Start the year/, "month 1"))) return;
  await page.waitForTimeout(300);
  await check(page, "month");

  // Into a trap card, which is the densest screen in the product.
  for (let step = 0; step < 40; step++) {
    if ((await page.getByText(/^Warning · /).count()) > 0) break;
    const carryOn = page.getByRole("button", { name: /^Carry on/ });
    if ((await carryOn.count()) > 0) {
      await carryOn.click();
      await page.waitForTimeout(120);
      continue;
    }
    const next = page.getByRole("button", { name: /^Next month/ });
    if ((await next.count()) > 0) {
      await next.click();
      await page.waitForTimeout(120);
      continue;
    }
    const close = page.getByRole("button", { name: /^Finish the month/ });
    if ((await close.count()) > 0 && (await close.isEnabled())) {
      await close.click();
      await page.waitForTimeout(150);
      continue;
    }
    const choices = page.locator("main button:not([disabled])");
    const count = await choices.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const label = await choices.nth(i).innerText();
      if (/Set money aside|Borrow money|Pay some back/.test(label)) continue;
      await choices.nth(i).click();
      clicked = true;
      break;
    }
    if (!clicked) break;
    await page.waitForTimeout(120);
  }

  if ((await page.getByText(/^Warning · /).count()) > 0) await check(page, "trap card");
  else fail("never reached a trap card to measure");

  // And the borrow sheet, where the numbers that matter most are shown.
  const borrow = page.getByRole("button", { name: /^Borrow money/ });
  if ((await borrow.count()) > 0) {
    await borrow.click();
    await page.waitForTimeout(200);
    await check(page, "borrow sheet");
  } else {
    fail("the borrow sheet never opened, so its numbers were never measured");
  }
});

console.log(
  problems.length === 0
    ? `\ni18n: every screen survives words 35% longer at 360px`
    : `\n${problems.length} i18n layout failures`,
);
process.exit(problems.length === 0 ? 0 : 1);
