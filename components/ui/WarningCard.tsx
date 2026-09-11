import { cx } from "@/lib/cx";

/**
 * The trap, wearing a label.
 *
 * Two jobs at once, and they pull against each other. The message inside has to look
 * like the real message, because recognising the real message is the entire skill. And
 * the frame around it has to be unmistakably a warning, because this is a game and
 * nobody should learn what a scam looks like by being scammed without being told.
 *
 * So: the frame shouts, the contents do not. A red left stroke, a header naming the
 * channel and the sender, and then the pitch in a quoted block that reads exactly as it
 * would on a phone. No wink, no emoji, no "can you spot it?".
 */
export function WarningCard({
  header,
  children,
  className,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-[var(--radius-card)] border border-line border-l-4 border-l-warn bg-card",
        className,
      )}
    >
      <p className="bg-warn-tint px-4 py-2.5 text-[length:var(--text-label)] leading-[var(--leading-label)] font-medium text-warn">
        {header}
      </p>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </section>
  );
}

/**
 * The pitch itself, set apart.
 *
 * A left rule and a slightly grey ground, so it is visibly a quotation of something
 * that arrived rather than something this product is saying.
 */
export function Pitch({ from, lines }: { from: React.ReactNode; lines: string[] }) {
  return (
    <figure className="m-0 rounded-[var(--radius-button)] bg-ground p-3">
      <figcaption className="mb-1.5 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
        {from}
      </figcaption>
      <div className="flex flex-col gap-1.5">
        {lines.map((line, i) => (
          <p key={i} className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {line}
          </p>
        ))}
      </div>
    </figure>
  );
}
