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

  /** Safe action: primary buttons, progress fill, links, the Cousin monogram. */
  accent: "#0f6e56",
  accentTint: "#e4efea",

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
  ["warn", "ground"],
  ["warn", "card"],
  ["warn", "warnTint"],
  ["card", "warn"],
] as const;

/** The floor every pairing above must clear. WCAG 2.1 AA for body text. */
export const MIN_CONTRAST = 4.5;
