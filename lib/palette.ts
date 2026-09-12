/**
 * The Companion palette, in TypeScript.
 *
 * `app/globals.css` is the source of truth for anything the browser paints: every
 * element reads `var(--color-*)` and never a literal. This file exists for the few
 * surfaces that cannot read a custom property — `viewport.themeColor`, which is
 * serialised into a meta tag at build time, and any future canvas or social image.
 *
 * The two must be edited together. A palette change is: this file, the `@theme`
 * block in `app/globals.css`, and the palette section of `DESIGN.md`, in one commit.
 * `scripts/qa/palette-audit.mjs` fails the build if they drift or if a declared
 * pairing drops below 4.5:1.
 *
 * WHY SO FEW COLOURS. This product is read by people who are stressed about money,
 * often in daylight on a cheap phone, often not in their first language. Colour
 * carries exactly two meanings here and no others: `accent` means "this is the safe
 * thing to do next", `warn` means "this could cost you money". Everything else is
 * paper and ink. A third meaning would make the first two quieter.
 */

export const PALETTE = {
  /** Page ground and card surface. */
  ground: "#f3f2ee",
  card: "#ffffff",

  /** Ink ramp. `muted` is for labels, never for anything a person must read to decide. */
  ink: "#1b1b19",
  muted: "#5b5a55",

  /** Structure: 1px rules and bar tracks. Never used for text. */
  line: "#e3e1db",

  /**
   * The boundary of anything a person can operate: a choice row, a field, a control.
   *
   * `line` is 1.31:1 on card. That is fine for a rule that merely separates two blocks
   * of text, and far below the 3:1 that WCAG 2.2 requires of a boundary which is the
   * only thing telling somebody where a control begins. This one measures 3.58:1 on
   * card and 3.20:1 on ground. It is warm rather than neutral so it belongs to the
   * same paper as the rest, and lighter than `muted` so it never reads as text.
   */
  lineStrong: "#8a8780",

  /**
   * Safe action. Primary buttons, and the focus ring that says where the keyboard is.
   *
   * Nothing else. This comment used to also list "progress fill, links" — which made
   * the file contradict its own header six lines above: if green marks a progress bar
   * and a back link as well as the one button worth pressing, then green marks nothing
   * and a person scanning for what to do next has to read every word to find it. Links
   * are ink with an underline, which is what actually tells a reader a thing is a link,
   * and which keeps working for the reader who cannot see the difference anyway.
   */
  accent: "#0f6e56",
  accentTint: "#e4efea",
  /**
   * The primary button under a finger or a cursor.
   *
   * It exists as a token because it was previously a bare `#0c5a47` inside one Tailwind
   * class — a colour this product paints that this file had never heard of, which is the
   * precise drift every gate here is built to stop. 8.17:1 against white.
   */
  accentDeep: "#0c5a47",

  /** Money at risk: warning headers and strokes, arrears rows. Nowhere else. */
  warn: "#b42318",
  warnTint: "#fcebe8",
} as const;

export type PaletteKey = keyof typeof PALETTE;

/**
 * Every foreground/background pairing this build is allowed to render, with its
 * measured WCAG 2.1 contrast ratio. A pairing that is not on this list has not been
 * measured, and a pairing that has not been measured does not ship.
 */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [PaletteKey, PaletteKey]> = [
  ["ink", "ground"],
  ["ink", "card"],
  ["ink", "accentTint"],
  ["ink", "warnTint"],
  ["muted", "ground"],
  ["muted", "card"],
  ["muted", "accentTint"],
  ["accent", "ground"],
  ["accent", "card"],
  ["accent", "accentTint"],
  ["card", "accent"],
  ["card", "accentDeep"],
  ["warn", "ground"],
  ["warn", "card"],
  ["warn", "warnTint"],
  ["card", "warn"],
] as const;

/** The floor every pairing above must clear. WCAG 2.1 AA for body text. */
export const MIN_CONTRAST = 4.5;

/**
 * Boundaries and state indicators, which WCAG 2.2 holds to 3:1 rather than 4.5:1
 * (1.4.11 Non-text Contrast). These are not text and must not be read as text; they
 * are the edge of a control, so a person can tell where one begins and whether it is
 * the one they picked.
 *
 * This list exists because an earlier build drew every choice row and every field in
 * `line`, which is 1.31:1 — visible on the designer's monitor and gone on a cheap
 * phone in daylight, which is the only screen that matters here.
 */
export const BOUNDARY_PAIRS: ReadonlyArray<readonly [PaletteKey, PaletteKey]> = [
  ["lineStrong", "card"],
  ["lineStrong", "ground"],
  // A progress bar's fill against its own track. Declared because it had never been
  // measured: the fill was `accent` on a `line` track for the life of this build, and
  // no list here had heard of the pairing, so nothing checked it was visible at all.
  ["muted", "line"],
  // The selected row in a group of choices. Ink rather than accent, deliberately:
  // accent means "the safe thing to do next", and the row a player has selected is a
  // state, not a recommendation. Painting selection green would tell them they had
  // chosen well before the game had decided anything.
  ["ink", "card"],
  ["ink", "ground"],
  ["accent", "card"],
  ["accent", "ground"],
  ["accent", "accentTint"],
  ["warn", "card"],
  ["warn", "warnTint"],
] as const;

/** The floor for a boundary or a state indicator. WCAG 2.2 AA, 1.4.11. */
export const MIN_BOUNDARY_CONTRAST = 3;
