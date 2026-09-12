"use client";

import { cx } from "@/lib/cx";

/**
 * Cousin.
 *
 * The older cousin who has been through it. Two sentences at most, present tense, and
 * never the words "you should have" — that phrase does not appear anywhere in this
 * product, and this is the component where it would have been most tempting.
 *
 * Dismissible, and small. The guide is help, not a narrator: a player who does not
 * need the explanation should be able to make it go away and not meet it again on that
 * card. This is why the design is a short card and explicitly not a chat thread.
 *
 * The tint is what says whose voice this is. The name above it is ink: `accent` is the
 * colour of the one thing worth pressing, and a speaker's name is not a thing to press.
 */
export function CousinCard({
  name,
  children,
  onDismiss,
  dismissLabel,
  className,
}: {
  name: React.ReactNode;
  children: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}) {
  return (
    <aside
      className={cx(
        "rounded-[var(--radius-card)] bg-accent-tint p-4",
        className,
      )}
    >
      <p className="m-0 mb-1 text-[length:var(--text-label)] leading-[var(--leading-label)] font-medium">
        {name}
      </p>
      <div className="text-[length:var(--text-body)] leading-[var(--leading-body)]">{children}</div>
      {onDismiss && dismissLabel ? (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 min-h-12 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted underline underline-offset-4"
        >
          {dismissLabel}
        </button>
      ) : null}
    </aside>
  );
}
