// A whole year, played in a real browser.
//
//   npm run build && node scripts/qa/smoke.mjs
//
// The engine properties prove the month is right. This proves a person can reach it:
// that the buttons exist, that the screens follow one another, and that twelve months
// of decisions end on a final statement with words on it. Those are different failures
// and neither suite catches the other's.
import { mkdirSync } from "fs";
import { join } from "path";
import { POISON, ROOT, VIEWPORTS, newPage, overflowOf, withServer } from "./browser.mjs";

const OUT = process.env.QA_SHOT_DIR ?? join(ROOT, ".shots");
mkdirSync(OUT, { recursive: true });

const problems = [];
const fail = (what) => {
  problems.push(what);
  console.log(`  FAIL ${what}`);
};
const ok = (what) => console.log(`  ok   ${what}`);

/** Every screen is checked for these the moment it is reached, not only at the end. */
async function scan(page, where) {
  const body = await page.locator("body").innerText();
  const poison = body.match(POISON);
  if (poison) fail(`${where}: page prints "${poison[0]}"`);
  const overflow = await overflowOf(page);
  if (overflow > 1) fail(`${where}: ${overflow}px of horizontal overflow`);
  // The voice rules are not decoration. A blaming sentence reaching a player is a
  // product failure, and it is cheap to check on every screen a journey touches.
  for (const phrase of ["should have", "your fault", "you failed", "too late"]) {
    if (body.toLowerCase().includes(phrase)) fail(`${where}: says "${phrase}"`);
  }
  return body;
}

const shot = (page, name) => page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });

await withServer(async ({ browser, base }) => {
  const page = await newPage(browser, VIEWPORTS.phone);
  await page.goto(base, { waitUntil: "networkidle" });

  await scan(page, "title");
  await shot(page, "01-title");
  ok("title screen");

  await page.getByRole("button", { name: /^Start$/ }).click();
  await page.waitForTimeout(200);
  await scan(page, "pick a life");
  await shot(page, "02-pick-life");

  // Every life must be pickable, and every tile must say it is unreviewed.
  const unreviewed = await page.getByText(/Not yet reviewed by the community/).count();
  if (unreviewed !== 3) fail(`pick a life: ${unreviewed} of 3 tiles carry the review label`);
  else ok("all three lives labelled unreviewed");

  await page.getByRole("button", { name: /Maria/ }).click();
  await page.getByLabel(/Your name/).fill("Ana");
  await page.getByRole("button", { name: /Start the year/ }).click();
  await page.waitForTimeout(300);

  const first = await scan(page, "month 1");
  if (!first.includes("Month 1 of 12")) fail(`month 1: heading missing, saw "${first.slice(0, 80)}"`);
  if (!first.includes("Ana")) fail("month 1: the name the player typed is not on screen");
  await shot(page, "03-month-1");
  ok("month 1 reached with the player's own name");

  // Play the year. Each pass answers whatever is on the table, then closes the month.
  let months = 0;
  let sawWarning = false;
  for (let step = 0; step < 80; step++) {
    const heading = await page.locator("h1, h2").first().innerText().catch(() => "");

    const finished = await page.getByRole("button", { name: /Play another life/ }).count();
    if (finished > 0) break;

    const next = page.getByRole("button", { name: /^Next month$/ });
    if ((await next.count()) > 0) {
      await scan(page, `receipt ${months}`);
      if (months === 1) await shot(page, "04-receipt");
      await next.click();
      await page.waitForTimeout(150);
      continue;
    }

    const carryOn = page.getByRole("button", { name: /^Carry on$/ });
    if ((await carryOn.count()) > 0) {
      await scan(page, `outcome ${months}`);
      if (!sawWarning && (await page.getByText(/Why this could cost you money/).count()) === 0) {
        // an outcome screen, nothing to record
      }
      if (months <= 4) await shot(page, `05-outcome-m${months}`);
      await carryOn.click();
      await page.waitForTimeout(150);
      continue;
    }

    if ((await page.getByText(/^Warning · /).count()) > 0 && !sawWarning) {
      sawWarning = true;
      await shot(page, "06-warning-card");
      await scan(page, "warning card");
      const leave = await page.getByText(/Not sure\? Leave it\./).count();
      if (leave === 0) fail("warning card: no 'leave it' note, which every trap must carry");
      else ok("warning card carries the no-pressure note");
    }

    // Answer today's situation by taking the first offered choice, then close.
    const close = page.getByRole("button", { name: /^Finish the month$/ });
    const enabled = (await close.count()) > 0 && (await close.isEnabled());
    if (enabled) {
      await scan(page, `month ${months + 1}`);
      await close.click();
      months += 1;
      await page.waitForTimeout(200);
      continue;
    }

    const choices = page.locator("main button:not([disabled])");
    const count = await choices.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const label = await choices.nth(i).innerText();
      if (/Set money aside|Borrow money|Pay some back|Finish the month/.test(label)) continue;
      await choices.nth(i).click();
      clicked = true;
      break;
    }
    if (!clicked) {
      fail(`stuck on "${heading}" with nothing to press`);
      break;
    }
    await page.waitForTimeout(150);
  }

  if (months < 12) fail(`the year stopped after ${months} months`);
  else ok(`played all ${months} months`);
  if (!sawWarning) fail("no trap card appeared in twelve months");
  else ok("met at least one trap");

  const report = await scan(page, "final statement");
  await shot(page, "07-final-statement");
  for (const must of ["Three things worth remembering", "What the traps took", "Free help"]) {
    if (!report.includes(must)) fail(`final statement: missing "${must}"`);
  }
  if (!/18222/.test(report)) fail("final statement: no help line number on it");
  ok("final statement carries rules, trap cost and help lines");

  if (page.qaErrors.length) fail(`browser console: ${page.qaErrors[0]}`);
  else ok("no console errors in a full run");
});

console.log(
  problems.length === 0
    ? `\nsmoke: a full year played clean, screenshots in ${OUT}`
    : `\n${problems.length} smoke failures`,
);
process.exit(problems.length === 0 ? 0 : 1);
