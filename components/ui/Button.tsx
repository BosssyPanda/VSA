"use client";

import { cx } from "@/lib/cx";
import type { ChoiceKind } from "@/lib/types";

/**
 * The only button in the product.
 *
 * Three kinds, and the kind carries meaning rather than emphasis: `primary` and
 * `secondary` are safe things to do, `quiet` is the risky path. A risky action is
 * never dressed as a button, and it is never hidden either — a game that hides the
 * option a real lender is pushing teaches nothing about resisting it.
 *
 * Full width and wrapping text on purpose: a translated label is often half again as
 * long as the English one, and a label that truncates is a label that lies.
 */
export function Button({
  kind = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: ChoiceKind }) {
  return (
    <button
      type="button"
      className={cx(
        "w-full min-h-12 px-4 py-3.5 text-[length:var(--text-body)] leading-[var(--leading-body)]",
        "font-medium text-balance transition-colors duration-150",
        kind === "primary" && "rounded-[var(--radius-button)] bg-accent text-card hover:bg-[#0c5a47]",
        kind === "secondary" &&
          "rounded-[var(--radius-button)] border-[1.5px] border-accent bg-card text-accent hover:bg-accent-tint",
        kind === "quiet" && "text-muted underline underline-offset-4 hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}
