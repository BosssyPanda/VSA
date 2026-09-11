import { cx } from "@/lib/cx";
import { clamp } from "@/lib/format";

/**
 * A thin bar. Progress through the year, or how full the cushion is.
 *
 * Always labelled in words next to it, never on its own — a bar is a picture of a
 * number, and a picture of a number is not readable to somebody who is scanning in
 * three seconds. It carries `aria-hidden` for exactly that reason: the text beside it
 * already says the same thing, and a screen reader should not hear it twice.
 */
export function Bar({ value, max = 1, className }: { value: number; max?: number; className?: string }) {
  const fraction = max <= 0 ? 0 : clamp(value / max, 0, 1);
  return (
    <div
      aria-hidden="true"
      className={cx("h-1.5 w-full overflow-hidden rounded-[var(--radius-bar)] bg-line", className)}
    >
      <div
        className="h-full rounded-[var(--radius-bar)] bg-accent transition-[width] duration-200"
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
            i < step ? "bg-accent" : "bg-line",
          )}
        />
      ))}
    </div>
  );
}
