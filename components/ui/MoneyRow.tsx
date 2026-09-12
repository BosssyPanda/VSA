import { cx } from "@/lib/cx";
import { Label } from "./Card";

/**
 * A line of money: what it is, then how much.
 *
 * Label above value, never beside it. A two-column row with a fixed-width label breaks
 * the moment the label is Tagalog, and this layout survives a translation half again as
 * long as the English. It is also the reading order a person actually wants: name the
 * thing, then say the number.
 *
 * `atRisk` is the only place outside the warning card that may reach for warning red,
 * and it means one thing — money that is late or growing. The palette audit holds this
 * file to that.
 */
export function MoneyRow({
  label,
  value,
  note,
  atRisk = false,
  glyph,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  note?: React.ReactNode;
  atRisk?: boolean;
  glyph?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <Label>{label}</Label>
      <span
        className={cx(
          "text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold",
          atRisk && "text-warn",
        )}
      >
        {glyph ? <span className="mr-1.5">{glyph}</span> : null}
        {value}
      </span>
      {note ? <Label className="mt-0.5">{note}</Label> : null}
    </div>
  );
}
