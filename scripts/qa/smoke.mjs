// A whole year, played in a real browser.
//
//   npm run build && node scripts/qa/smoke.mjs
//
// The engine properties prove the month is right. This proves a person can reach it:
// that the buttons exist, that the screens follow one another, and that twelve months
// of decisions end on a final statement with words on it. Those are different failures
// and neither suite catches the other's.
import { mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { POISON, ROOT, VIEWPORTS, newPage, offendersOf, overflowOf, redOn, withServer } from "./browser.mjs";

const EN = JSON.parse(readFileSync(join(ROOT, "messages/en.json"), "utf8"));

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
  if (overflow > 1) {
    const offenders = await offendersOf(page);
    fail(`${where}: ${overflow}px of horizontal overflow — ${offenders.join(" · ")}`);
  }
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

  // The lives are selectable tiles now, not buttons that start the game on one tap.
  // Start appears once one is picked, and is absent — not greyed — before that.
  if ((await page.getByRole("button", { name: /^Start the year$/ }).count()) > 0) {
    fail("pick a life: the start button is on screen before a life has been picked");
  }
  await page.getByRole("radio", { name: /Maria/ }).check();
  await page.getByLabel(/Your name/).fill("Ana");
  await page.getByRole("button", { name: /^Start the year$/ }).click();
  await page.waitForTimeout(300);

  const first = await scan(page, "month 1");
  if (!first.includes("Month 1 of 12")) fail(`month 1: heading missing, saw "${first.slice(0, 80)}"`);
  if (!first.includes("Ana")) fail("month 1: the name the player typed is not on screen");
  await shot(page, "03-month-1");
  ok("month 1 reached with the player's own name");

  // Play the year. Each pass answers whatever is on the table, then closes the month.
  let months = 0;
  let sawPitch = false;
  let sawWhy = false;
  for (let step = 0; step < 140; step++) {
    const heading = await page.locator("h1, h2").first().innerText().catch(() => "");

    if ((await page.getByRole("button", { name: /Play another life/ }).count()) > 0) break;

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
      const body = await scan(page, `outcome ${months}`);
      // The reasons moved here; they did not disappear. Without this, deleting the
      // block outright would pass every other check in this file.
      if (body.includes("Why this could cost you money")) sawWhy = true;
      if (months <= 4) await shot(page, `05-outcome-m${months}`);
      await carryOn.click();
      await page.waitForTimeout(150);
      continue;
    }

    // A message that arrived. Structural, not a phrase: the pitch is the one <figure>
    // in this product, so this check survives every future rewording of the channel line.
    const pitch = page.locator("main figure");
    if ((await pitch.count()) > 0 && !sawPitch) {
      sawPitch = true;
      await shot(page, "06-trap-card");
      await scan(page, "trap card");

      if ((await page.getByText(/Not sure\? Leave it\./).count()) === 0) {
        fail("trap card: no 'leave it' note, which every trap must carry");
      } else {
        ok("trap card carries the no-pressure note");
      }

      // The rule the whole redesign turns on: before a decision, a trap looks like a
      // life card. No red rule, no warning banner, no list of reasons. A player who
      // learns "the red one is the scam" has learned a colour their own phone will
      // never draw.
      const red = await redOn(page);
      if (red.length > 0) fail(`trap card is painted red before the decision: ${red.join(" · ")}`);
      else ok("a trap card carries no warning colour until it is answered");

      if ((await page.getByText(/Why this could cost you money/).count()) > 0) {
        fail("trap card gives the reasons away before the player decides");
      } else {
        ok("the reasons are held back for the outcome");
      }
    }

    // Answer today's situation: choose, confirm, and only then close the month.
    const choices = page.locator("main fieldset input[type=radio]");
    const cont = page.getByRole("button", { name: /^Continue$/ });
    if ((await cont.count()) > 0) {
      await cont.click();
      await page.waitForTimeout(150);
      continue;
    }
    if ((await choices.count()) > 0) {
      await scan(page, `month ${months + 1}`);
      await choices.first().check();
      await page.waitForTimeout(100);
      if ((await page.getByRole("button", { name: /^Continue$/ }).count()) === 0) {
        fail("a choice was selected and no way to confirm it appeared");
        break;
      }
      continue;
    }

    const finish = page.getByRole("button", { name: /^Finish the month$/ });
    if ((await finish.count()) > 0) {
      await scan(page, `month ${months + 1}`);
      await finish.click();
      months += 1;
      await page.waitForTimeout(200);
      continue;
    }

    fail(`stuck on "${heading}" with nothing to press`);
    break;
  }

  if (months < 12) fail(`the year stopped after ${months} months`);
  else ok(`played all ${months} months`);
  if (!sawPitch) fail("no trap card appeared in twelve months");
  else ok("met at least one trap");
  if (!sawWhy) fail("no outcome ever explained why a trap could cost money");
  else ok("the outcome explains what the card held back");

  const report = await scan(page, "final statement");
  await shot(page, "07-final-statement");
  // The words come from the catalogue, not from this file. A gate that hardcodes the
  // English it expects starts failing the day somebody improves the copy, and the fix
  // reached for then is to edit the gate — which teaches everybody that gates lie. What
  // is worth asserting is that each section of the statement reached the screen at all.
  for (const key of ["final.rules", "final.trapCost", "final.help"]) {
    const must = EN[key];
    if (!report.includes(must)) fail(`final statement: missing ${key} — "${must}"`);
  }
  if (!/18222/.test(report)) fail("final statement: no help line number on it");
  ok("final statement carries rules, trap cost and help lines");

  // Help, which is entered by problem rather than by organisation. Nobody arrives
  // knowing that the body which enforces the rent cap is the Rating and Valuation
  // Department, so the first screen asks one question in the words a person would use.
  await page.getByRole("button", { name: /^Help$/ }).first().click();
  await page.waitForTimeout(250);
  const help = await scan(page, "help");
  await shot(page, "08-help");

  const topics = Object.keys(EN)
    .filter((k) => /^helpTopic\..+\.label$/.test(k))
    .map((k) => EN[k]);
  if (!help.includes(EN["help.question"])) fail(`help: "${EN["help.question"]}" is not on the screen`);
  const missing = topics.filter((label) => !help.includes(label));
  if (missing.length) fail(`help: ${missing.length} topics missing — ${missing.join(" · ")}`);
  else ok(`help asks one question and offers ${topics.length} answers`);
  if (!/18222/.test(help)) fail("help: the emergency number is not one tap from the top");

  await page.getByRole("button", { name: topics[0] }).click();
  await page.waitForTimeout(250);
  await scan(page, "help topic");
  await shot(page, "09-help-topic");
  const dialable = await page.locator('main a[href^="tel:"]').count();
  // P21e holds this in the engine; this proves the screen renders what the engine holds.
  if (dialable < 2) fail(`help topic: ${dialable} numbers to call, and a topic must offer two`);
  else ok(`a help topic leads to ${dialable} places to call`);

  await page.getByRole("button", { name: EN["help.allTopics"] }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: EN["help.figures"] }).click();
  await page.waitForTimeout(250);
  const sources = await scan(page, "sources");
  await shot(page, "10-sources");
  if (!sources.includes(EN["fact.min-wage-hourly.label"])) {
    fail("sources: the figures ledger did not reach its own page");
  } else {
    ok("the figures ledger has its own page, off the help path");
  }

  if (page.qaErrors.length) fail(`browser console: ${page.qaErrors[0]}`);
  else ok("no console errors in a full run");
});

console.log(
  problems.length === 0
    ? `\nsmoke: a full year played clean, screenshots in ${OUT}`
    : `\n${problems.length} smoke failures`,
);
process.exit(problems.length === 0 ? 0 : 1);
