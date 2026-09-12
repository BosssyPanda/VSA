/**
 * The message, exactly as it arrived.
 *
 * A left caption naming who it is from, a slightly grey ground, and the lines as they
 * were sent. Visibly a quotation of something that arrived rather than something this
 * product is saying — and visibly nothing else.
 *
 * There is deliberately no red rule, no warning header and no list of reasons. This
 * component used to be `WarningCard`, which put a warn-tinted banner and a 4px red
 * stroke around a trap before the player had read a word of it. That design taught
 * "red border means scam", and a real SMS does not draw one. Red, the tells and the
 * reasons all moved to the outcome, which is where they teach something, and the pitch
 * is now left to do the only job that matters: look like the real thing.
 */
export function Pitch({ from, lines }: { from: React.ReactNode; lines: string[] }) {
  return (
    <figure className="m-0 rounded-[var(--radius-button)] border border-line bg-ground p-3">
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
