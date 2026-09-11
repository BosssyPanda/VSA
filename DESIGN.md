# Month End — design contract

This file is binding. `scripts/qa/palette-audit.mjs`, `scripts/qa/type-floor.mjs`,
`scripts/qa/no-literals.mjs` and `scripts/qa/messages-audit.mjs` enforce the parts of
it that a machine can check. The rest is enforced at review.

## Who this is for

People in Hong Kong who are handling money under pressure and getting little help
with it: Hong Kong-born South Asian young adults, migrant domestic workers, and
low-income families in subdivided flats. Often reading a cheap phone in daylight.
Often not in their first language. Often worried while they read.

Everything below follows from that sentence. When a decision is unclear, re-read it.

## The feeling to aim for

> Someone trustworthy is helping me handle my money one step at a time.

Friendly, dignified, adult. Never childish, never patronising, never luxurious, never
themed around being poor. The interface has to feel safe to somebody who is frightened
about debt.

## What this is not

- Not a chat app. The guide speaks in short cards, not an endless thread.
- Not a bank dashboard. No charts, no portfolio, no fintech gloss.
- Not a worksheet. No dense forms, no small print, no walls of bullet points.
- Not a dopamine machine. No badges, no streaks, no confetti, no countdown timers.

## Information hierarchy

The month screen shows these, in this order, and nothing else:

1. **Where I am** — name, month *n* of 12, a thin progress bar.
2. **Your money** — one module, not three cards: money you have now (the largest figure
   on the screen), due this month, total owed, money set aside. Four numbers a person
   compares against each other, so they sit in one place with one border around them
   and a shared set of labels. Three separate white rounded boxes made them look like
   three unrelated topics, which is exactly what they are not.
3. **Today's situation** — one card. A life event, or a message that arrived.
4. **What you decide** — the choices, as equally weighted rows. See below.
5. **Cousin** — a short optional explanation, only when it helps.
6. **Navigation** — Month, Help, and the language control.

Rules of thumb: understandable in three to five seconds; one main task per section;
never more than three or four actions on screen at once.

**Money set aside is never shown as a failure.** "HK$ 0 of HK$ 5,100" is a true
sentence and a demoralising screen, and demoralising the player is not a teaching
method. The bar shows progress toward the *next* step, not the year's target, and the
target is named beside it rather than looming over it.

## Choices, and why none of them is the green one

Every choice the game will grade — on a trap card and on a life card alike — is drawn
as a row of equal visual weight, with a selection control, and a **Continue** that
appears once something is selected. Consequence comes after Continue, never before.

This replaces an earlier design in which the safe action was a filled primary button,
the second safe action was outlined, and the risky one was a quiet text link. That
design taught the player to press the green one. Pressing the green one is a skill with
no value outside this website: a real money lender's SMS does not arrive with the safe
answer already styled, and a person who learned the colour learned nothing they can use
on the day it matters. What has to transfer is noticing the tell, so the interface
stops doing the noticing.

`ChoiceKind` survives in the data, where it still records which path is risky, and the
outcome and the report still read it. It no longer reaches the screen before a decision.

**Before a decision, a trap card and a life card look the same.** No red rule, no
warning header, no list of reasons this might be risky. A card names who the message is
from and what it says, and then asks. Red, the tells, and the "why this was risky"
points all belong to the outcome, which is where they teach something. A player who
learns "red border means scam" has learned another colour, and their phone will not
draw one.

The safety rail is not the styling, it is the exit: **"Not sure? Leave it. It comes back
next month, and that costs nothing"** is on every card, before the choices, always. No
timers, no countdowns, no card that must be answered now.

## Actions that are not available

**Nothing in this product is a greyed-out button.** An action is either available, or it
is absent and one plain line says what would make it available — "Answer today's message
to finish the month" rather than a dead grey control that says only *no*. A disabled
control makes a person wonder whether they have broken something; a sentence tells them
what to do next.

This also removes a colour the palette would otherwise have had to define and measure,
and a state every component would have had to implement. It is the cheaper design and
the kinder one, which is a rarer combination than it sounds.

## Type

One family: Public Sans, Latin subset, loaded through `next/font` with a system
fallback stack. It covers English, Tagalog and Bahasa Indonesia. Traditional Chinese
and the South Asian scripts each need their own file and their own bundle check, which
is why they are a later locale rather than a later font switch.

| Token | Size | Line | Weight | Used for |
|---|---|---|---|---|
| `--text-display` | 28→36px | 1.15 | 600 | the page heading, one per screen |
| `--text-figure` | 34px | 40px | 600 tabular | the one big money figure per screen |
| `--text-section` | 22px | 28px | 600 | the heading above a group |
| `--text-title` | 19px | 26px | 600 | card titles, the player's name |
| `--text-body` | 17px | 24px | 400 | body copy, buttons, choice rows |
| `--text-label` | 15px | 22px | 400, or 500 above a figure | field labels, secondary lines |
| `--text-min` | 14px | 18px | 500 | navigation labels — the smallest text that exists |

**Every step carries a weight, and that is not decoration.** An earlier version of this
table gave a size and a line height and left weight to whoever wrote the component, so
19px shipped at 400, 500 and 600 on three different screens and nobody could say which
was correct. `qa:palette` now fails the build on a type token whose comment does not
name a weight.

`--text-display` is a `clamp()`: 28px on a phone, 36px on a computer, everything in
between. Both ends are `rem` and the middle term is `rem`-dominant, so browser zoom
still scales it — checked at 200% by `qa:a11y`. One token, not two, because a page
heading that needs a breakpoint to know its own size will eventually get one wrong.

**14px is a floor, not a default.** There is no smaller step. `qa:type-floor` fails the
build on `text-xs`, on any arbitrary size below 14px, and on tracked uppercase — which
costs about a tenth of reading speed and breaks on long translated compounds.

Numbers are tabular everywhere, so money columns line up digit for digit.

## Colour

Ten tokens. Mirrored in `lib/palette.ts` and the `@theme` block of
`app/globals.css`; a change means both files and this section, in one commit.

| Token | Hex | Meaning |
|---|---|---|
| `ground` | `#f3f2ee` | the page |
| `card` | `#ffffff` | a surface holding one thing |
| `ink` | `#1b1b19` | anything a person must read |
| `muted` | `#5b5a55` | labels, never a decision |
| `line` | `#e3e1db` | 1px rules and bar tracks — **never the edge of a control** |
| `line-strong` | `#8a8780` | the edge of anything a person can operate |
| `accent` | `#0f6e56` | **the safe thing to do next** |
| `accent-tint` | `#e4efea` | a quiet accent surface |
| `warn` | `#b42318` | **this could cost you money** |
| `warn-tint` | `#fcebe8` | the warning header |

Colour carries exactly two meanings here. A third would make the first two quieter, so
`warn` may only be referenced by the components that render money at risk — there is an
allowlist in the palette audit, and it fails the build.

Every foreground/background pairing this build renders is listed in `CONTRAST_PAIRS`
and measured. The worst is 5.27:1, against a floor of 4.5:1. A pairing that has not
been measured does not ship.

**Boundaries are measured separately, against 3:1.** WCAG 2.2 holds the edge of a
control to 1.4.11 rather than to the text rule, and `line` is 1.31:1 on card — visible
on a designer's monitor and gone on a cheap phone in daylight, which is the only screen
that matters here. Anything a person can operate — a choice row, a field, a selectable
tile — is bounded in `line-strong` (3.58:1 on card, 3.20:1 on ground) and listed in
`BOUNDARY_PAIRS`. `line` keeps its job of separating two blocks of text and loses the
one it was never good enough for.

Colour is never the only channel: a tier, a delta or a warning also carries a word or a
glyph.

## Shape and motion

Three radii: cards 16px, buttons 12px, bars fully round. No shadows, no gradients, no
illustrations of people, no decorative icons. Every visual difference means something.

Motion is a fade or a short slide, 160–200ms. Nothing shakes, scrambles, counts up,
flips or spins. `prefers-reduced-motion` makes everything instant. A person deciding
whether to take a loan is not to be entertained while they decide.

## Layout: phone and computer

The same content, the same order, at every width. A desktop adds room, never material —
somebody who plays on a library computer and somebody who plays on their phone have to
be able to talk about the same screen.

| Width | Layout |
|---|---|
| below 768px | one column, max 480px, 20px gutters, navigation at the bottom |
| 768–1023px | one column, max 560px, navigation moves to a top bar |
| 1024px and up | top bar; two columns, `--w-shell` 944px total: a 360px rail (where I am, your money) that stays put while the 560px column (today, choices, Cousin) scrolls |

Phone first, and not as a slogan: the order above is the phone order, and the computer
layout is that order with the first two sections moved into a rail. Nothing is designed
wide and then stacked. Where a screen has no rail-worthy content it stays one column at
every width, centred, rather than being spread to fill a 1280px monitor because the room
is there.

Tap targets are at least 48px. The primary action sits in the thumb zone on a phone.
Zoom is never blocked.

## Surfaces

A white card means *these things belong together and are one thing*. It is not a way to
make text look designed. Most groupings on most screens are better served by a heading,
a rule, and space — and a screen where everything is in a card is a screen where the
card has stopped meaning anything.

The test before adding one: **would a person be confused if these two blocks were
separated by a line instead of a border?** If not, use the line. Removing a surface
that carried no meaning always makes the screen clearer, so remove it.

Where this bites hardest: Pick a life, the final statement, Help, and the sources
ledger. All four were lists of near-identical white boxes, which reads as a form to be
completed rather than something to be read.

## Navigation and language

Two destinations, and a language control that is not a destination.

| | Phone (below 768px) | Computer |
|---|---|---|
| Destinations | bottom bar: Month · Help | top bar, after the wordmark |
| Language | in the header, always visible | top bar, right |

**No icons.** The navigation is words. A mixed set — an emoji here, a filled glyph
there, an outline icon somewhere else — is worse than none, and a consistent outline
family is a real commitment this product has not made and should not fake. Words also
sidestep the whole class of bug that put a telephone emoji in a two-colour palette.

**The language control shows the current language in its own name** — `English`,
`Tagalog`, `Bahasa Indonesia` — not a globe, and not the word "Language". A control
labelled "Language" in English is invisible to exactly the person who needs it; a
control labelled `English` announces both what it is and what it is currently set to,
in the one word that a Tagalog speaker will recognise as *not theirs*. It sits in the
header on every screen, not behind a settings page.

## Help: entered by problem, not by organisation

The first Help screen asks one question — **"What do you need help with?"** — and offers
five answers in plain words: a message or call I do not trust · money I owe · a problem
at work · my flat or my rent · being treated unfairly. Picking one reveals the verified
services for it. Emergency stays one tap from everywhere.

Nobody arrives knowing that the body which enforces the rent cap is the Rating and
Valuation Department, and nobody should have to. The taxonomy is the person's problem.

**Every topic holds at least two services, for every life, and the engine checks it**
(`P21e`). A topic that leads to a single phone number is a tap that bought the player
nothing; an empty one is a dead end at the moment somebody needed it least. When that
property was first written, *my flat or my rent* was empty for two of the three lives,
because public government hotlines had been filtered by persona as if they were
personalised content. They are not. They are public numbers.

**The figures ledger is not help.** "Where the figures come from" moves to its own
Sources page. It is a promise this product keeps to anyone who wants to check it, and it
belongs next to the credits, not between a frightened person and a phone number.

## Words

Plain everyday English, short sentences, no jargon without a tappable `[[term]]`.
Reading level grade 6 or below in English. Money is always `HK$ 1,234`. Time is always
months. Dates read `30 Sep 2025`.

Every string comes from `messages/`. `qa:literals` fails the build on a hardcoded
sentence, because a hardcoded sentence is a sentence that cannot be translated.

Layouts must survive text about 35% longer than English: labels sit above values, never
beside them; buttons are full width and wrap; nothing truncates; no text is baked into
an image.

## Links

A link is shown as the site it goes to — `had.gov.hk`, `cyberdefender.hk` — never as the
whole address. Two reasons, and the second is the one that matters: a government path can
run past sixty characters with no space in it, which on a 390px phone is a line that
cannot wrap and a page that scrolls sideways; and the part of an address that tells a
person whether to trust it is the domain, which is exactly why a browser's own address bar
emphasises it. In a product about not being tricked, printing the path on top of the
domain buries the only part worth reading.

Nothing on any screen may make the page scroll sideways, at any width down to 320px. A
figure, a table or a diagram that genuinely needs more room gets its own scrolling pane;
a line of text never does.

## Numbers on screen

Every figure traces to a dated, sourced entry in the facts ledger, and every screen that
shows one also says when it was true. Anything that cannot be sourced is labelled as an
illustration rather than dressed up as a fact.

## Two voices

- **Cousin**, the guide. Second person, at most two sentences, present tense. Names the
  trap, never the player. The words "you should have" do not appear in this product.
- **The trap**, in its own script. Written to look like the real message, because
  recognising the real message is the skill. It never explains itself and never winks.

The explaining happens after a decision, in the outcome and in "why this may be risky".

## No pressure, ever

No timers. No countdowns. No disappearing offers enforced by the game. Every trap card
can be left unanswered: it comes back next month once, at no cost. Safe actions are
listed first; the risky path is present, honest and quiet.
