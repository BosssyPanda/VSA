import { cx } from "@/lib/cx";
import { clamp } from "@/lib/format";

/**
 * A thin bar. Progress through the year, or how full the cushion is.
 *
 * Always labelled in words next to it, never on its own — a bar is a picture of a
 * number, and a picture of a number is not readable to somebody who is scanning in
 * three seconds. It carries `aria-hidden` for exactly that reason: the text beside it
 * already says the same thing, and a screen reader should not hear it twice.
 *
 * The fill is `muted`, not `accent`. Accent means "this is the safe thing to do next",
 * and being seven months into a year is not a thing to do — it is a fact. Painting it
 * green spent the product's one action colour on a decoration, which is how a colour
 * stops meaning anything. `lineStrong` was the obvious alternative and is wrong for a
 * different reason: against the `line` track it measures 2.74:1, under the 3:1 WCAG
 * 2.2 asks of a non-text indicator. `muted` is 5.29:1 on the same track.
 */
export function Bar({ value, max = 1, className }: { value: number; max?: number; className?: string }) {
  const fraction = max <= 0 ? 0 : clamp(value / max, 0, 1);
  return (
    <div
      aria-hidden="true"
      className={cx("h-1.5 w-full overflow-hidden rounded-[var(--radius-bar)] bg-line", className)}
    >
      <div
        className="h-full rounded-[var(--radius-bar)] bg-muted transition-[width] duration-200"
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}

/** Twelve steps, one per month. Discrete because a year is counted, not measured. */
export function StepBar({ step, steps }: { step: number; steps: number }) {
  return (
    <div aria-hidden="true" className="flex gap-1">
      {Array.from({ length: steps }, (_, i) => (
        <span
          key={i}
          className={cx(
            "h-1.5 flex-1 rounded-[var(--radius-bar)]",
            i < step ? "bg-muted" : "bg-line",
          )}
        />
      ))}
    </div>
  );
}
