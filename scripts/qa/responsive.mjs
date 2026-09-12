// The same screens, at the three widths this product is actually read at.
//
//   npm run build && node scripts/qa/responsive.mjs
//
// 360 is a cheap Android in a shop today; 768 is a tablet or a phone turned sideways;
// 1280 is a library computer. The design contract promises the same content in the same
// order at all three, with the navigation at the bottom on a phone and at the top from
// 768px. This checks the promise rather than trusting the media queries.
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

/** Walk from the title into a live month, so the check covers the busiest screen. */
async function intoMonth(page, base) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Start$/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole("radio", { name: /Amir/ }).check();
  await page.getByRole("button", { name: /Start the year/ }).click();
  await page.waitForTimeout(300);
}

/**
 * Where the navigation sits.
 *
 * There are two `<nav>` elements in the markup — one in the top bar, one fixed to the
 * bottom — and exactly one of them is ever painted. The first version of this read
 * `querySelector("nav")` and would happily have measured the hidden one, reported it at
 * 0,0 and called the phone layout correct. So: every nav with a box, and the count, so a
 * build that shows both at once fails rather than passing on whichever came first.
 */
function navPosition(page) {
  return page.evaluate(() => {
    const shown = [...document.querySelectorAll("nav")].filter((nav) => {
      const box = nav.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    });
    if (shown.length === 0) return null;
    const box = shown[0].getBoundingClientRect();
    return { top: box.top, height: box.height, viewport: window.innerHeight, count: shown.length };
  });
}

await withServer(async ({ browser, base }) => {
  for (const vp of [VIEWPORTS.small, VIEWPORTS.tablet, VIEWPORTS.computer]) {
    const before = problems.length;
    const page = await newPage(browser, { width: vp.width, height: vp.height });
    await intoMonth(page, base);

    const body = await page.locator("body").innerText();
    const poison = body.match(POISON);
    if (poison) fail(`${vp.width}px: page prints "${poison[0]}"`);

    const overflow = await overflowOf(page);
    if (overflow > 1) {
      fail(`${vp.width}px: ${overflow}px of horizontal overflow — ${(await offendersOf(page)).join(" · ")}`);
    }

    const nav = await navPosition(page);
    if (!nav) {
      fail(`${vp.width}px: no navigation on the month screen`);
    } else {
      // Measured as a share of the viewport rather than against zero: the top bar pads
      // its own contents, so the <nav> inside it starts eight pixels down and a `<= 2`
      // rule failed a layout that was correct.
      const atBottom = nav.top >= nav.viewport * 0.75;
      const atTop = nav.top + nav.height <= nav.viewport * 0.25;
      if (nav.count !== 1) fail(`${vp.width}px: ${nav.count} navigations on screen at once`);
      if (vp.width < 768 && !atBottom) fail(`${vp.width}px: navigation is not at the bottom`);
      if (vp.width >= 768 && !atTop) fail(`${vp.width}px: navigation is not at the top`);
    }

    // The language control is in the header on every screen at every width, because
    // somebody who cannot read the interface cannot be asked to find a settings page
    // written in it.
    const language = await page.getByRole("button", { name: /Choose your language/ }).count();
    if (language !== 1) {
      fail(`${vp.width}px: ${language} language controls in the header, expected one`);
    }

    // Nothing may be clipped or squeezed below the type floor at any width.
    const tooSmall = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll("main *, nav *")) {
        if (!el.textContent?.trim()) continue;
        const size = Number.parseFloat(getComputedStyle(el).fontSize);
        if (size && size < 13.9) bad.push(`${el.tagName.toLowerCase()} at ${size}px`);
      }
      return bad.slice(0, 3);
    });
    if (tooSmall.length) fail(`${vp.width}px: text below the 14px floor — ${tooSmall.join(", ")}`);

    // Every tap target on a phone has to be reachable with a thumb.
    if (vp.width < 768) {
      const small = await page.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll("main button, nav button, header button, main a")) {
          const box = el.getBoundingClientRect();
          if (box.height > 0 && box.height < 44) bad.push(`${el.textContent?.trim().slice(0, 24)} (${Math.round(box.height)}px)`);
        }
        return bad.slice(0, 3);
      });
      if (small.length) fail(`${vp.width}px: tap targets under 44px — ${small.join(", ")}`);
    }

    await page.screenshot({ path: join(OUT, `responsive-${vp.width}.png`), fullPage: true });
    if (page.qaErrors.length) fail(`${vp.width}px console: ${page.qaErrors[0]}`);
    // Only if nothing above failed. The first version printed "ok 768px" on the line
    // after "FAIL 768px", which is how a suite teaches everybody to skim past it.
    if (problems.length === before) ok(`${vp.width}px`);
    await page.close();
  }
});

console.log(
  problems.length === 0
    ? `\nresponsive: clean at 360, 768 and 1280`
    : `\n${problems.length} responsive failures`,
);
process.exit(problems.length === 0 ? 0 : 1);
