"use client";

import { cx } from "@/lib/cx";

export type NavTab = { id: string; label: string; glyph: string };

/**
 * Where you are in the product.
 *
 * A bottom bar on a phone, because that is where a thumb is, and a top bar from 768px,
 * because a bottom bar on a desktop is a phone app pretending. Same tabs, same order,
 * same words — a person on a library computer and a person on a phone have to be able
 * to talk about the same screen.
 *
 * Each tab carries a glyph as well as a word. Not decoration: at 14px in daylight on a
 * cheap screen, a shape is found faster than a label, and the label is still there for
 * anybody the shape does not help.
 */
export function Nav({
  tabs,
  active,
  onSelect,
}: {
  tabs: NavTab[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      className={cx(
        "fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card",
        "md:inset-x-0 md:top-0 md:bottom-auto md:border-t-0 md:border-b",
      )}
    >
      <ul className="mx-auto flex w-full max-w-[var(--w-column-wide)] list-none justify-around p-0 lg:max-w-[944px] lg:justify-start lg:gap-2">
        {tabs.map((tab) => {
          const current = tab.id === active;
          return (
            <li key={tab.id} className="flex-1 lg:flex-none">
              <button
                type="button"
                onClick={() => onSelect(tab.id)}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-4 py-2",
                  "text-[length:var(--text-min)] leading-[var(--leading-min)]",
                  "md:flex-row md:gap-2 md:text-[length:var(--text-body)]",
                  current ? "font-medium text-accent" : "text-muted",
                )}
              >
                <span aria-hidden="true">{tab.glyph}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
