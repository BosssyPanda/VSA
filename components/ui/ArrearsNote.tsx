/**
 * A payment is late.
 *
 * Its own component for one reason: warning red is allowlisted per file by the palette
 * audit, and this is the only line on the month screen that has earned it. Keeping it
 * here rather than inline means a whole screen never gets licence to reach for the
 * colour that means "this could cost you money".
 *
 * The wording that goes in here is the caller's, and it counts months rather than
 * dollars, because a lender escalates on the count.
 */
export function ArrearsNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-warn">
      {children}
    </p>
  );
}
