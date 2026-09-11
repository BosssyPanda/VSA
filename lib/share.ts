"use client";

import { hkd } from "./format";
import { ticket } from "./replay";
import { runReport } from "./report";
import type { Locale, RunState } from "./types";

/**
 * Sharing a year, in the place this audience actually shares things.
 *
 * WhatsApp, not a link preview and not an image: the Equal Opportunities Commission
 * found 83% of ethnic-minority residents use it, and a domestic worker's Sunday is
 * spent in it. So the payload is plain text that survives being pasted anywhere.
 *
 * What it deliberately does not carry: no score, no comparison with anybody, no cash
 * balance, and nothing that could embarrass somebody whose year went badly. A tier
 * word, what the traps took, and a ticket so a friend can meet the same twelve months.
 */

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Where a shared ticket can be opened. Relative, so it works on any deployment. */
export function ticketPath(run: RunState): string {
  return `?play=${encodeURIComponent(ticket(run))}`;
}

export function buildShareText(run: RunState, t: Translate, locale: Locale = "en"): string {
  const report = runReport(run);
  const lines = [
    t("share.headline", {
      app: t("app.name"),
      tier: report.verdict.title,
      glyph: report.verdict.glyph,
    }),
    t("share.months", { months: report.monthsPlayed, total: report.months }),
  ];

  if (report.trapCost > 0) {
    lines.push(t("share.trapCost", { amount: hkd(report.trapCost, locale) }));
  } else {
    lines.push(t("share.noTrapCost"));
  }

  if (report.trapsSpotted > 0) {
    lines.push(t("share.spotted", { count: report.trapsSpotted }));
  }

  lines.push("");
  lines.push(t("share.invite"));
  lines.push(ticket(run));

  return lines.join("\n");
}

export type ShareOutcome = "shared" | "whatsapp" | "copied" | "failed";

/**
 * Share it, by whatever route this browser actually has.
 *
 * The system sheet first, WhatsApp second, the clipboard last. Safari and in-app
 * browsers each drop one of these, and a share button that silently does nothing is
 * worse than one that says "copied".
 */
export async function shareText(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      // A cancelled share is a decision, not a failure. Anything else falls through.
      if (error instanceof DOMException && error.name === "AbortError") return "shared";
    }
  }

  if (typeof window !== "undefined") {
    try {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (opened) return "whatsapp";
    } catch {
      /* popup blocked — the clipboard is still there */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
