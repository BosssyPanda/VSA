"use client";

import { cx } from "@/lib/cx";

/** Two kinds, and neither of them says anything about risk. */
export type ButtonKind = "primary" | "secondary";

/**
 * The only button in the product.
 *
 * `primary` is the way forward from this screen — continue, finish the month, start.
 * `secondary` is a side action that is still available here. That is the whole system,
 * and it deliberately no longer has a third kind: `quiet` used to dress the risky path
 * as an underlined text link, which taught the player to press the filled green one and
 * to distrust the small grey one. Neither skill survives contact with a real money
 * lender's SMS. Risk is drawn nowhere; it is decided by reading.
 *
 * There is no `disabled`, and the type refuses it, so the compiler holds the rule rather
 * than a reviewer's memory. An action in this product is available, or it is absent with
 * one plain line saying what would make it available. A greyed-out control makes a person
 * wonder what they broke; a sentence tells them what to do next.
 *
 * Full width and wrapping text on purpose: a translated label is often half again as
 * long as the English one, and a label that truncates is a label that lies.
 */
export function Button({
  kind = "primary",
  className,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> & { kind?: ButtonKind }) {
  return (
    <button
      type="button"
      className={cx(
        "w-full min-h-12 rounded-[var(--radius-button)] px-4 py-3.5",
        "text-[length:var(--text-body)] leading-[var(--leading-body)]",
        "font-medium text-balance transition-colors duration-150",
        kind === "primary" && "bg-accent text-card hover:bg-accent-deep",
        kind === "secondary" && "border border-line-strong bg-card text-ink hover:bg-ground",
        className,
      )}
      {...rest}
    />
  );
}
