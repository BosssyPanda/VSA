"use client";

import { LanguageControl } from "@/components/ui/LanguageControl";
import { cx } from "@/lib/cx";

export type Destination = { id: string; label: string };

/**
 * Where you are, and what language you are reading in.
 *
 * **No icons.** The navigation is words. A mixed set — an emoji here, a filled glyph
 * there, an outline icon somewhere else — reads worse than none, and a consistent
 * outline family is a real commitment this product has not made and should not fake.
 * Words also sidestep the whole class of bug that once put a telephone emoji into a
 * two-colour palette.
 *
 * The header is sticky rather than fixed so the page does not need to reserve room for
 * it, and so a person at 200% zoom scrolls it away instead of losing a third of the
 * screen to chrome.
 *
 * The current destination is marked in ink and an underline, not in accent: accent means
 * "the safe thing to do next", and where you already are is not a suggestion.
 */
export function TopBar({
  wordmark,
  destinations = [],
  active,
  onSelect,
}: {
  wordmark: string;
  destinations?: Destination[];
  active?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-[var(--w-column)] items-center gap-3 px-5 py-2 md:max-w-[var(--w-column-wide)] lg:max-w-[var(--w-shell)]">
        <span className="text-[length:var(--text-label)] leading-[var(--leading-label)] font-medium">
          {wordmark}
        </span>
        {destinations.length > 0 && onSelect ? (
          <nav className="hidden md:block">
            <ul className="m-0 flex list-none gap-1 p-0">
              {destinations.map((d) => (
                <li key={d.id}>
                  <DestinationLink
                    destination={d}
                    current={d.id === active}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <LanguageControl className="ml-auto" />
      </div>
    </header>
  );
}

/**
 * The phone's navigation, at the bottom where a thumb is.
 *
 * It disappears at 768px, where the same two words are already in the top bar. A bottom
 * bar on a desktop is a phone app pretending to be one.
 */
export function BottomNav({
  destinations,
  active,
  onSelect,
}: {
  destinations: Destination[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card md:hidden">
      <ul className="mx-auto m-0 flex w-full max-w-[var(--w-column)] list-none justify-around p-0">
        {destinations.map((d) => (
          <li key={d.id} className="flex-1">
            <DestinationLink
              destination={d}
              current={d.id === active}
              onSelect={onSelect}
              className="justify-center"
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DestinationLink({
  destination,
  current,
  onSelect,
  className,
}: {
  destination: Destination;
  current: boolean;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(destination.id)}
      aria-current={current ? "page" : undefined}
      className={cx(
        "flex min-h-12 w-full items-center px-4 py-2",
        "text-[length:var(--text-body)] leading-[var(--leading-body)]",
        current ? "font-medium text-ink underline decoration-2 underline-offset-8" : "text-muted",
        className,
      )}
    >
      {destination.label}
    </button>
  );
}
