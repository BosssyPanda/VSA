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
2. **Money now** — cash on hand. The largest figure on the screen.
3. **What I owe** — total, and what is due this month.
4. **Safety cushion** — how much is set aside, out of one month's pay.
5. **Today's situation** — one card. A life event, or a warning holding a trap's message.
6. **Actions** — two or three, one of them primary.
7. **Cousin** — a short optional explanation, only when it helps.
8. **Navigation** — Month, Help, Words.

Rules of thumb: understandable in three to five seconds; one main task per section;
never more than three or four actions on screen at once.

## Type

One family: Public Sans, Latin subset, loaded through `next/font` with a system
fallback stack. It covers English, Tagalog and Bahasa Indonesia. Traditional Chinese
and the South Asian scripts each need their own file and their own bundle check, which
is why they are a later locale rather than a later font switch.

| Token | Size | Line | Used for |
|---|---|---|---|
| `--text-figure` | 34px | 40px | the one big money figure per screen |
| `--text-title` | 19px | 26px | card titles, the player's name |
| `--text-body` | 17px | 24px | body copy, buttons, choices |
| `--text-label` | 15px | 22px | field labels, secondary lines |
| `--text-min` | 14px | 18px | navigation labels — the smallest text that exists |

**14px is a floor, not a default.** There is no smaller step. `qa:type-floor` fails the
build on `text-xs`, on any arbitrary size below 14px, and on tracked uppercase — which
costs about a tenth of reading speed and breaks on long translated compounds.

Numbers are tabular everywhere, so money columns line up digit for digit.

## Colour

Nine tokens. Mirrored in `lib/palette.ts` and the `@theme` block of
`app/globals.css`; a change means both files and this section, in one commit.

| Token | Hex | Meaning |
|---|---|---|
| `ground` | `#f3f2ee` | the page |
| `card` | `#ffffff` | a surface holding one thing |
| `ink` | `#1b1b19` | anything a person must read |
| `muted` | `#5b5a55` | labels, never a decision |
| `line` | `#e3e1db` | 1px rules and bar tracks |
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
| 1024px and up | top bar; two columns, 944px total: a 360px rail (where I am, money) that stays put while the 560px column (today, actions, Cousin) scrolls |

Tap targets are at least 48px. The primary action sits in the thumb zone on a phone.
Zoom is never blocked.

## Words

Plain everyday English, short sentences, no jargon without a tappable `[[term]]`.
Reading level grade 6 or below in English. Money is always `HK$ 1,234`. Time is always
months. Dates read `30 Sep 2025`.

Every string comes from `messages/`. `qa:literals` fails the build on a hardcoded
sentence, because a hardcoded sentence is a sentence that cannot be translated.

Layouts must survive text about 35% longer than English: labels sit above values, never
beside them; buttons are full width and wrap; nothing truncates; no text is baked into
an image.

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
