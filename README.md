# Month End · 月尾

A short browser game about getting to the end of the month with money left, and about
recognising the traps that eat it — money lenders, agency debt, rent rises and the scam
messages that reach every phone in Hong Kong.

It is a **website**, for phones and computers. No app to install, no sign-up, no
account. A run lives in your browser and nothing is sent anywhere.

## Who it is for

People in Hong Kong who are handling money under pressure and getting little help with
it: Hong Kong-born South Asian young adults, migrant domestic workers, and low-income
families in subdivided flats. One city, three lives, one shared deck of traps.

## What makes it different

- **You survive a month, not a market.** Twelve months. Winning is stability — a
  cushion, no arrears, family covered — never a net worth.
- **The trap speaks for itself.** Scam and loan pitches are written the way the real
  ones are written, because recognising the real one is the skill. The explaining
  happens after you decide.
- **You are never the joke.** No card blames you for where you started, and nothing in
  the game pressures you to decide about money today.
- **Every number is real and dated.** Figures come from a sourced ledger, and every
  screen that shows one also shows when it was true.
- **The community has the last word.** Cards are reviewed by people from the
  communities they are about, and they are credited. A life nobody has reviewed yet
  says so on screen.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run qa         # typecheck, lint, palette, type floor, literals, messages
npm run qa:shot    # screenshots at 390 / 768 / 1280
npm run build
```

Node 22 or newer.

## Languages

English is the source language. Tagalog and Bahasa Indonesia are in the repository from
the first commit and appear in the language picker only when they are complete, so that
nobody is handed a screen half in one language. Translations come from community
partners through the review sheet — never from a machine.

## Origin and credits

Forked from [LifePatch](https://github.com/bosssypanda/lifepatch), which is a
year-by-year American financial game for teenagers. The seeded engine and the QA
discipline come from there; the audience, economics, voice and design do not.

Community reviewers and partner organisations are credited inside the game, on the
Credits tab.

This is a game, not financial advice.
