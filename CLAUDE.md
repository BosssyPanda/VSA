# Month End — project instructions

Month End (月尾) is a Next.js (App Router) + TypeScript **website** — phone and
computer, not an installable app — about surviving a month on a low income in Hong
Kong, and recognising the traps that eat it.

Read `DESIGN.md` before touching anything a person sees. It is binding, and four QA
scripts enforce the checkable half of it.

## The audience, in one line

People handling money under pressure with little help: Hong Kong-born South Asian young
adults, migrant domestic workers, and low-income families in subdivided flats. Often on
a cheap phone, in daylight, not in their first language, while worried.

## Rules that are not negotiable

1. **The trap is the antagonist. The player never is.** No card, outcome or verdict
   blames somebody for the situation they started in. The phrase "you should have" does
   not appear in this product.
2. **Every figure is real, dated and sourced.** Numbers come from `lib/facts.ts`, each
   with a value, a unit, an `asOf` date and a source URL. Anything unsourced is labelled
   an illustration. Screens that show a figure also show when it was true.
3. **Every word comes from `messages/`.** `npm run qa:literals` fails on a hardcoded
   string. English is the source language; Tagalog and Bahasa Indonesia ship only when
   complete, and machine translation is never committed to those files.
4. **14px is the type floor.** No exceptions, no tracked uppercase.
5. **Two colours mean something** — green for the safe next step, red for money at
   risk. Red is allowlisted in `scripts/qa/palette-audit.mjs`.
6. **No pressure mechanics.** No timers, countdowns, streaks or badges. Every trap card
   can be left for next month at no cost.
7. **Nothing leaves the browser.** No accounts, no database, no analytics, no
   third-party scripts. localStorage only, and the Help screen says so.
8. **Community review gates content.** Cards for a persona with a partner organisation
   ship only when a reviewer from that organisation has approved them. A persona with no
   reviewer yet says so on screen.

## Working rules

- Concepts on outcomes are **explicit**. Never infer what a card taught from its words.
- The engine is pure and seeded: same seed, same run. `lib/rng.ts` is shared by the live
  run and the replay, and changing it invalidates every recorded run.
- Content lives in `content/cards/*.ts` (structure) plus generated string and review
  files. Do not hand-edit anything under `content/generated/`.
- Prefer adding a QA gate over adding a convention nobody can check.

## Checks

```
npm run qa            # typecheck, lint, palette, type floor, literals, messages
npm run qa:shot       # screenshots at 390 / 768 / 1280, fails on overflow or "NaN"
```

Never push red.

## Audio

Version 1 is silent, and `tone`/`howler` are deliberately absent from the bundle. Every
string record reserves a `voice` slot for recorded plain-language narration, which is
the accessibility feature this audience actually needs. If music is added later, follow
a serious game-music workflow: purpose, emotional target, BPM/key/bars, a composition
plan and beat map before any audio, adaptive stems when state changes, metadata JSON per
cue, and a QC pass on loops, loudness and originality. Original work only — never copy
an existing song, beat, melody or arrangement.

## Origin

Forked from LifePatch, a year-by-year American financial game written for teenagers. The
engine shape, the seeded RNG and the QA discipline come from there. The voice, the
economics, the design and the audience do not.
