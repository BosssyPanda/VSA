# Month End — design contract

This file is binding. `scripts/qa/palette-audit.mjs`, `scripts/qa/type-floor.mjs`,
`scripts/qa/no-literals.mjs`, `scripts/qa/messages-audit.mjs` and — in a real browser —
`scripts/qa/smoke.mjs`, `responsive.mjs`, `i18n-expand.mjs` and `a11y.mjs` enforce the
parts of it that a machine can check. The rest is enforced at review.

`qa:a11y` begins by breaking a page on purpose and watching four of its own probes fire
— colour-only, nameless control, target size, heading order — because a check that
searches for something and can never find it reports a clean page forever. Two of them
were exactly that until the self-test caught them. The clipped-text, motion and
focus-ring assertions are not yet self-tested, which is a gap in the gate rather than a
property of the page.

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
5. **Move your money** — set aside, pay back, borrow. Below the decision, not above it:
   these three lived inside the money module, read well, and pushed today's situation
   past the fold on a 390px phone. The one thing the screen exists to show was off the
   bottom of it, behind three controls most months do not need. Nothing is hidden and
   nothing is greyed; they are simply after the month's task rather than in front of it.
6. **Cousin** — a short optional explanation, only when it helps.
7. **Navigation** — Month, Help, and the language control.

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

**Nothing in this product is a greyed-out button**, and `Button`'s own type refuses a
`disabled` prop so the compiler holds the rule rather than a reviewer's memory. An action
is either available, or it is absent and one plain line says what would make it available — "Answer today's message
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
| `--text-label` | 15px | 22px | 400, or 500 above a figure | field labels, secondary lines — the smallest text that exists |

There used to be a seventh row here, `--text-min` at 14px, described as the size of the
navigation labels. No component ever used it: the navigation labels are 17px, which is
the right size for somebody who is not confident with phones and is the reason nothing
in this product is set at 14px. The hard floor is still 14px and `qa:type-floor` still
enforces it — the ramp simply never goes down there.

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

Eleven tokens. Mirrored in `lib/palette.ts` and the `@theme` block of
`app/globals.css`; a change means both files and this section, in one commit.

| Token | Hex | Meaning |
|---|---|---|
| `ground` | `#f3f2ee` | the page |
| `card` | `#ffffff` | a surface holding one thing |
| `ink` | `#1b1b19` | anything a person must read |
| `muted` | `#5b5a55` | labels, and the fill of a progress bar — never a decision |
| `line` | `#e3e1db` | 1px rules and bar tracks — **never the edge of a control** |
| `line-strong` | `#8a8780` | the edge of anything a person can operate |
| `accent` | `#0f6e56` | **the safe thing to do next** — primary buttons and the focus ring, and nothing else |
| `accent-tint` | `#e4efea` | a quiet accent surface |
| `accent-deep` | `#0c5a47` | the primary button under a finger, and nothing else |
| `warn` | `#b42318` | **this could cost you money** |
| `warn-tint` | `#fcebe8` | the warning header |

Colour carries exactly two meanings here. A third would make the first two quieter, so
`warn` may only be referenced by the components that render money at risk — there is an
allowlist in the palette audit, and it fails the build.

**Accent is spent on primary buttons and the focus ring, and on nothing else.** It used
to also paint progress fill, back links and the guide's name, which is the same mistake
in four places: if green marks the one button worth pressing *and* a bar counting months
*and* a link back to a list *and* a speaker's name, then green has stopped marking
anything, and a person scanning for what to do next has to read every word to find it.
Progress bars fill in `muted`, links are ink with an underline, and the guide's name is
ink inside its tint. The tint still says whose voice it is.

`line-strong` looks like the obvious choice for a bar fill and is wrong: against the
`line` track it measures 2.74:1, below the 3:1 WCAG 2.2 asks of a non-text indicator.
`muted` is 5.29:1 on the same track.

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

A bar's fill against its own track is measured there too. It had not been: the fill was
`accent` on a `line` track for the life of this build and no list here had heard of the
pairing, so nothing checked the bar was visible at all.

Colour is never the only channel: a tier, a delta or a warning also carries a word or a
glyph.

## Buttons

Two kinds, and neither of them says anything about risk. `primary` is the way forward
from this screen — Continue, Finish the month, Start. `secondary` is a side action still
available here. There is no third kind: `quiet` used to dress the risky path as an
underlined text link, which taught one skill — press the filled green one — and that
skill does not survive contact with a real lender's SMS.

The **Borrow** sheet has two secondary buttons and no primary, and it is the only sheet
that does. It used to make "Not now" the filled green button and the loan a quiet link; a
player who needs the money that month reads that as being told off. The sheet's job is to
show the cost over one month and over twelve, plainly, and then get out of the way.

The **Repay** and **Set aside** sheets do carry a primary, because paying a debt down and
putting money by really are the safe thing to do next — which is the same rule, not an
exception to it. A sheet is not automatically two secondaries; it depends on whether the
action it confirms is one the product would recommend.

A link is not a button, and the element follows the destination rather than the look.
Moving between views of this app fetches nothing and has no address, so it is a
`button`; a phone number and somebody else's website are real destinations, so they are
anchors. `components/ui/Link.tsx` holds both — `NavLink` for the first, `OutLink` for
the second in three sizes: body for a phone number beside a language, title for a phone
number that is the point of its card, label for the site a figure came from.

## Shape and motion

Three radii: cards 16px, buttons 12px, bars fully round. No shadows, no gradients, no
illustrations of people, no decorative icons. Every visual difference means something.

| Token | Value | Used for |
|---|---|---|
| `--radius-card` | 16px | cards, sheets, tinted panels |
| `--radius-button` | 12px | buttons, choice rows, amount chips |
| `--radius-bar` | 999px | bar tracks and fills |
| `--w-column` | 480px | the reading column on a phone, and the bottom sheet |
| `--w-column-wide` | 560px | the column from 768px up, and the centred dialog |
| `--w-rail` | 360px | the desktop rail: where I am, your money, move your money |
| `--w-shell` | 944px | rail + column + the gap between them |

Spacing is Tailwind's 4px scale and is not re-tokenised. Inside a component the steps
are 2, 4, 6, 8, 10, 12, 14, 16, 20 and 24px; between and around them the product also
uses 32, 40, 80 and 112px, the last being the room the fixed bottom navigation needs on
a phone. 10px is the gap between stacked buttons and between the rows of a tight list,
and it earns its half-step by appearing nine times.

There are four transitions in the whole product and none of them moves anything: three
colour changes at 150ms — a button, a choice row, a life tile, each under a finger — and
the progress bar's width at 200ms. Nothing fades, slides, shakes, scrambles, counts up,
flips or spins, and the sheet appears rather than sliding despite its name.
`prefers-reduced-motion` makes even those four instant. A person deciding whether to
take a loan is not to be entertained while they decide.

## Layout: phone and computer

The same content, the same order, at every width. A desktop adds room, never material —
somebody who plays on a library computer and somebody who plays on their phone have to
be able to talk about the same screen.

| Width | Layout |
|---|---|
| below 768px | one column, max 480px, 20px gutters, navigation at the bottom |
| 768–1023px | one column, max 560px, navigation moves to a top bar |
| 1024px and up | top bar; two columns, `--w-shell` 944px total: a 360px rail (where I am, your money, move your money) beside the 560px column (today, choices, Cousin) |

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

**A link is ink with an underline, never accent.** The underline is what tells a reader
this is a link — which is why the colour was free to go back to ink, and why the link
still reads as one for somebody who cannot tell green from black. Underlines are offset
so descenders do not sit on the rule.

**Every link is at least 48px tall.** The source links used to be 22px lines of text,
under even the 24px WCAG 2.2 asks for, and the accessibility gate exempts inline anchors
so nothing caught it. Somebody opening a government page to check whether a figure is
real is doing it on a phone, one-handed, often while upset.

A link to a service is shown as the site it goes to — `had.gov.hk`, `cyberdefender.hk` — never as the
whole address. Two reasons, and the second is the one that matters: a government path can
run past sixty characters with no space in it, which on a 390px phone is a line that
cannot wrap and a page that scrolls sideways; and the part of an address that tells a
person whether to trust it is the domain, which is exactly why a browser's own address bar
emphasises it. In a product about not being tricked, printing the path on top of the
domain buries the only part worth reading. A link to a *source* is the exception: the
facts ledger prints the name of the instrument — "Money Lenders Ordinance (Cap. 163),
s.24" — because which law it is, is the thing being checked.

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
can be left unanswered: it comes back next month once, at no cost, and that exit sits
above the choices rather than under them.

Safe actions are listed first, in the order the deck was written. The risky path is
present and honest and drawn no differently — "quiet" was a styling word from the design
this one replaced, and a risky option rendered as small grey underlined text is the
interface doing the player's noticing for them.

## Components, and every state they have

There is no `disabled` anywhere in this product. An action is available, or it is absent
with one plain line saying what would make it available. A greyed-out control makes a
person wonder what they broke; a sentence tells them what to do next. `Button`'s type
refuses the prop, so the compiler holds the rule rather than a reviewer's memory.

| Component | States | How each is drawn |
|---|---|---|
| `Button` | primary | `accent` fill, `card` text; `accent-deep` under a finger |
| | secondary | `card` fill, `line-strong` edge, ink text; `ground` on hover |
| `NavLink` | one | body 17px, ink, underlined, 48px tall — a `button`, not an anchor |
| `OutLink` | `call` | body 17px medium, ink, underlined, 48px tall, `tel:` |
| | `callLarge` | title 19px semibold, ink, underlined, 48px tall, `tel:` |
| | `site` | label 15px, ink, underlined, 48px tall, wraps anywhere, opens beside the game |
| `ChoiceRow` | unselected | `card` fill, `line-strong` edge, radio unchecked |
| | selected | `ground` fill, **ink** edge, label to medium, radio checked |
| | hovered | `ground` fill, 150ms |
| Money-sheet option and amount chip | unselected | `card` fill, `line-strong` edge |
| | selected | `ground` fill, **ink** edge, label to medium |
| | hovered | `ground` fill |
| Life tile | unselected | `card` fill, `line-strong` edge |
| | selected | `ground` fill, **ink** edge — the name is semibold either way |
| | hovered | `ground` fill, 150ms |
| Help topic row | hovered | `ground` fill |
| `MoneyRow` | ordinary | label above value, value at 19/600 |
| | at risk | value in `warn`, plus a word — never colour alone |
| | with note | a third line in `muted` under the value |
| `Bar` / `StepBar` | any fill | `muted` on a `line` track, `aria-hidden` |
| `Sheet` | below 768px | bottom-anchored, full width to 480px, top corners rounded |
| | 768px and up | centred both axes, 560px, all four corners rounded |
| `Card` | one | `card` fill, `line` edge, 16px radius, 16px padding |
| `CousinCard` | speaking | `accent-tint` surface, **ink** name, ink body |
| | dismissed | absent — it does not return on that card |
| Navigation item | current | ink, medium, 2px underline at 8px offset, `aria-current="page"` |
| | not current | `muted`, no underline |

**Selection is ink, never accent, everywhere it appears.** A row a player has tapped is
a state, not a recommendation. Painting it green tells them they chose well before the
game has decided anything — and the place that mattered most was the money lender in the
borrow sheet, where the interface was congratulating somebody for selecting a loan.

Every selected state carries a second channel as well as the colour: a checked radio on
a choice row, a heavier label on a chip. Nothing in this product is distinguishable by
colour alone.

## Accessibility: what is checked, and by what

Two columns, because the difference matters: what the design promises, and what a
machine actually proves. A rule with a weaker check beside it is not a rule that is
failing — it is a rule currently held by review, and the row says so rather than letting
a green tick imply more than it earned.

`npm run qa` runs typecheck, lint, palette, type-floor, glyphs, literals, messages,
engine and golden. The browser gates — `qa:smoke`, `qa:responsive`, `qa:i18n`, `qa:a11y`
— need a build and a Chromium, so they live in `npm run qa:browser`. **There is no CI in
this repository yet**, so none of them fails anything until somebody runs it. Wiring
`qa` and `qa:browser` to pull requests is the single highest-value thing left on this
list.

| Criterion | What the design promises | What the check actually proves |
|---|---|---|
| 1.4.3 Contrast | every rendered pairing clears 4.5:1 | `qa:palette` measures every pair in `CONTRAST_PAIRS` (worst 5.27:1). It cannot see the DOM, so it proves the declared list is sound, not that the list is complete — completeness is held by review |
| 1.4.11 Non-text Contrast | operable edges and a bar's fill clear 3:1 | `qa:palette` measures `BOUNDARY_PAIRS` (worst 3.20:1). Same limit: the list is measured, not audited against what is painted |
| 1.4.1 Use of Colour | tier, delta, warning and selection each carry a word, a glyph or a control state as well as a colour | `qa:a11y`'s colour-only probe catches warn red used alone. Tiers, deltas and selection are held by the state table above and by review. `qa:glyphs` is a different check: it stops any glyph rendering as a colour emoji |
| 1.4.4 Resize Text | every screen holds at 200% | `qa:a11y` measures four: title, pick a life, month, help. Outcome, receipt, final statement and sources are not yet covered |
| 1.4.10 Reflow | nothing scrolls sideways at 320px | `qa:a11y` tests 320px on the month screen; `qa:responsive` walks every screen at 360, 768 and 1280 |
| 2.5.8 Target Size | every target clears 24px; the design floor is 48px | `qa:a11y` measures every target at 320px. It exempts inline anchors, which is how three 22px source links survived until this pass |
| 2.4.7 / 2.4.11 Focus | a 3px accent outline, offset 2px, never obscured | `qa:a11y` walks the page by keyboard and requires a visible ring at every stop — any outline of 2px or more, or a shadow. It does not check the colour, the offset, or whether something covers it |
| 2.1.2 No Keyboard Trap | the sheet takes focus, shows a way out, and closes on Escape | `qa:a11y` opens the borrow sheet and does exactly this |
| 2.3.3 Animation | `prefers-reduced-motion` makes everything instant | `qa:a11y` asserts it |
| 3.1.1 Language of Page | the document declares its language, and the provider rewrites it when the picker changes | `qa:a11y` checks the declaration |
| — | no text below 14px, no tracked uppercase | `qa:type-floor` greps every size in `app/` and `components/` |
| — | every screen survives words 35% longer than the English | `qa:i18n` re-renders each screen with expanded strings at 360px |

The focus ring is the one place other than a primary button where `accent` is spent. It
is an action indicator — it says where the keyboard is about to act — so it belongs to
the same meaning.

## What changed in this pass, and why

Every entry is a decision that changed something a player sees. The reason matters more
than the change: a redesign nobody can argue with is a redesign nobody can maintain.

**Selection colour — accent green → ink.**
Before, a chosen choice row, life tile, money lender and amount chip were all painted in
`accent` with a mint tint. After, they carry an ink border on a `ground` fill. The choice
row, the lender and the amount chip also take their label to medium weight; the life tile
does not, because its name is already semibold in both states and a second weight there
would say nothing. Accent means "the safe thing to do next"; a row the player has
selected is a state, not a recommendation. The worst case was the borrow sheet, where
the interface congratulated somebody in green for selecting a licensed money lender.

**The loan term — a quiet thirteenth payment → twelve.**
Before, the sheet read "HK$ 97, for 12 months" over a total of HK$ 1,171, and the engine
took a thirteenth payment of HK$ 19 to clear the balance. After, the instalment rounds up
rather than to nearest, so twelve months really is twelve at every amount the picker
offers. A product about what a lender does not tell you cannot shorten its own term on
screen.

**The verdict — five hexes → two meanings.**
Before, each stability tier injected a raw hex from the palette as an inline style, so
"Cushioned" was green and the palette gate could not see the file at all. After, a tier
declares a `tone` — neutral or at-risk — and the screen decides the colour. The tier
glyph (▲▲ ▲ ▬ ▼ ▼▼) already carried the verdict without colour; it still does, which is
what lets a greyscale screenshot of the last screen stay readable.

**Money — five cards → one module, and a sentence instead of subtraction.**
Before, cash, debt, cushion and what was due sat in four or five separate white cards,
and the player was left to subtract. After, one module carries all four, and a line says
in words whether this month ends with money left or money short.

**Choices — inside the message card → beside it.**
Before, bordered white choice rows sat inside a bordered white card, so two boundaries
enclosed the same thing and the card stopped meaning "these belong together". After, the
message is the card and the choices stand next to it.

**Accent — four jobs → one.**
Before, green marked primary buttons, progress fill, back links and the guide's name.
After, it marks primary buttons and the focus ring. See **Colour** for the reasoning and
for why `line-strong` was the wrong replacement for the bar fill.

**Buttons — three kinds → two, plus a link.**
Before, a `quiet` kind drew risky options as small grey underlined text, which taught one
skill: press the filled green one. After, `ButtonKind` has two kinds and the Figma
library has two variants; risk is drawn no differently from anything else.

`ChoiceKind` still carries the word `quiet`, and that is the point rather than an
oversight. The deck has to be able to say which option is the risky one — the ordering
lint reads it, and nine cards declare it — while the screen must not. The data knows; the
interface does not tell. Its docstring used to say "rendered as plain text rather than a
button", which was true of the design this one replaced and is now the opposite of the
rule.

**Control edges — `line` → `line-strong`.**
Before, every choice row and field was bounded in `line` at 1.31:1 — visible on a
designer's monitor and gone on a cheap phone in daylight. After, anything operable uses
`line-strong` at 3.58:1, which is what WCAG 2.2 asks of a boundary.

**The sheet — no visible exit → a way out that cannot be omitted.**
Before, the set-aside sheet could only be left with Escape or a tap on the backdrop,
neither of which is discoverable. After, `Sheet` draws the exit itself and the label is a
required prop, so a sheet cannot ship without one. A panel about money that can only be
left by spending some is the pressure this product exists to refuse.

**Help — organised by organisation → organised by problem.**
Before, help was a list of agencies. After, it is a list of the things that go wrong,
and each leads to the service that handles it. Somebody in trouble knows what happened
to them; they do not know which department owns it.

**Links — seven hand-written class strings → one component, and a real tap target.**
Before, the same underline-and-offset classes were retyped at seven call sites across
Help and Sources, and the three source links were 22px tall — under the 24px WCAG 2.2
asks for, and invisible to the gate, which exempts inline anchors. After,
`components/ui/Link.tsx` holds `NavLink` and `OutLink`, every link is 48px tall, and the
element follows the destination: a `button` for moving inside the app, an anchor for a
phone number or somebody else's site.

**The final statement — a figure with no meaning → the question people actually ask.**
Before, the cushion was shown only as an amount, and a row reading "How long that would
last · About 9 days" existed in the design file with no code behind it and no arithmetic
under it. After, the row is real: the money set aside divided by what a month costs —
rent, food, travel, *and* the debt payments, because a month with a loan in it costs
more. It reads in days up to two months and in months beyond that, and it says "about",
because a month is not 30 days and the screen should not pretend otherwise.

**The type ramp — a seventh step nobody used.**
Before, `--text-min` was declared at 14px and documented as the size of the navigation
labels. After, it is gone: the labels are 17px, which is the right size for somebody who
is not confident with phones. The 14px floor is still real and `qa:type-floor` still
enforces it — the ramp simply never goes down there.
