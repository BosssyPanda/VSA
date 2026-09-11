import type { Locale } from "./types";

/**
 * The minus glyph. U+2212, not the keyboard hyphen: at tabular figure widths a
 * hyphen sits short and high, and a column of negatives looks broken.
 */
const MINUS = "−";

/** What a figure that is not a figure prints as. Never "NaN", never "$undefined". */
const NO_FIGURE = "—";

const GROUPERS: Record<Locale, string> = {
  en: "en-HK",
  tl: "en-HK",
  id: "en-HK",
};

/**
 * Money, always in this shape: `HK$ 5,100`.
 *
 * The space after `HK$` is deliberate. At 34px the currency and the first digit
 * collide without it, and this figure is the one thing on the screen a person must
 * read correctly before anything else.
 *
 * Grouping stays `en-HK` in every locale on purpose: a Tagalog or Indonesian reader
 * in Hong Kong sees Hong Kong money written the Hong Kong way on their payslip, their
 * receipts and their remittance app, and the game should not be the odd one out.
 */
export function hkd(n: number, locale: Locale = "en"): string {
  if (!Number.isFinite(n)) return NO_FIGURE;
  const sign = n < 0 ? MINUS : "";
  const abs = Math.abs(Math.round(n));
  return `${sign}HK$ ${abs.toLocaleString(GROUPERS[locale])}`;
}

/** A whole-number percentage, e.g. `10%`. Fractions are for the engine, not the screen. */
export function pct(fraction: number): string {
  if (!Number.isFinite(fraction)) return NO_FIGURE;
  return `${Math.round(fraction * 100)}%`;
}

/** A month count, rounded to one decimal only when it is not whole. */
export function months(n: number): string {
  if (!Number.isFinite(n)) return NO_FIGURE;
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** An ISO date as a person reads it: `30 Sep 2025`. */
export function asOfDate(iso: string, locale: Locale = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NO_FIGURE;
  return new Intl.DateTimeFormat(GROUPERS[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * A link shown as the site it goes to: `had.gov.hk`, not the whole path.
 *
 * Two reasons, and the second is the one that matters. A government path can run to
 * sixty characters with no space in it, which on a 390px phone is a line that will not
 * wrap and a page that scrolls sideways. And the part of a link that tells a person
 * whether to trust it is the domain — which is exactly why a browser's own address bar
 * emphasises it. In a product about not being tricked, printing the path on top of the
 * domain buries the only part worth reading.
 */
export function siteName(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export { MINUS, NO_FIGURE };
