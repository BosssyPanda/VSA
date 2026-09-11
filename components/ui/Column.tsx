import { cx } from "@/lib/cx";

/**
 * The reading column.
 *
 * One column on a phone, one wider column on a tablet, and on a computer the same
 * column with room around it. The desktop layout adds space, never content: a person
 * who plays on a library computer and a person who plays on their phone must be able
 * to talk to each other about the same screen.
 */
export function Column({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full max-w-[var(--w-column)] px-5 md:max-w-[var(--w-column-wide)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
