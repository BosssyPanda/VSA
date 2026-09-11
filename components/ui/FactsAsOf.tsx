import { asOfDate } from "@/lib/format";
import type { Locale } from "@/lib/types";

/**
 * When these numbers were true.
 *
 * On screen wherever a figure is, not buried in an About page. The audience for this
 * product is told confident numbers by people who want something from them; the least
 * this can do is date its own.
 */
export function FactsAsOf({
  date,
  locale,
  label,
  className,
}: {
  date: string;
  locale: Locale;
  label: (vars: { date: string }) => string;
  className?: string;
}) {
  return (
    <p
      className={
        className ??
        "m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted"
      }
    >
      {label({ date: asOfDate(date, locale) })}
    </p>
  );
}
