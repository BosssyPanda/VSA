import { cx } from "@/lib/cx";

/**
 * The one big number on a screen.
 *
 * At most one per screen, by rule. Two competing 34px figures is the fintech-dashboard
 * failure the design contract exists to prevent: the eye has nowhere to land, and a
 * person who is tired or worried reads neither.
 */
export function Figure({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "block text-[length:var(--text-figure)] leading-[var(--leading-figure)] font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}
