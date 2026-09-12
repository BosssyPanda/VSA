"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { cx } from "@/lib/cx";
import { LOCALES } from "@/lib/i18n";

/**
 * The language control, which is not a settings page.
 *
 * It shows the current language in that language's own name — `English`, `Tagalog`,
 * `Bahasa Indonesia` — and never a globe, and never the word "Language". A control
 * labelled "Language" in English is invisible to exactly the person who needs it. A
 * control labelled `English` announces both what it is and what it is set to, in the one
 * word a Tagalog speaker will recognise as *not theirs*.
 *
 * It lives in the header on every screen, because somebody who cannot read the interface
 * cannot be asked to find a settings page written in it.
 *
 * Languages that are not ready are listed and not offered. Two reasons: the row is the
 * real row, so the layout is proved against Bahasa Indonesia today rather than on the
 * day a translation lands; and the honest answer to "is my language here?" is "not yet",
 * which is worse to read than "yes" and far better than an empty list that implies "no".
 */
export function LanguageControl({ className }: { className?: string }) {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Escape closes it, and so does moving focus or tapping anywhere else. A popover that
  // can only be dismissed by choosing something is a trap, and this product does not set
  // traps of its own.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const current = LOCALES.find((l) => l.id === locale) ?? LOCALES[0];

  return (
    <div ref={box} className={cx("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("language.choose")}
        onClick={() => setOpen((was) => !was)}
        className="flex min-h-12 items-center rounded-[var(--radius-button)] border border-line-strong bg-card px-3 py-2 text-[length:var(--text-label)] leading-[var(--leading-label)] text-ink hover:bg-ground"
      >
        {current.label}
      </button>

      {open ? (
        <ul className="absolute right-0 z-20 mt-1 m-0 flex w-max max-w-[16rem] list-none flex-col gap-1 rounded-[var(--radius-card)] border border-line-strong bg-card p-2">
          {LOCALES.map((l) =>
            l.ready ? (
              <li key={l.id}>
                <button
                  type="button"
                  aria-current={l.id === locale ? "true" : undefined}
                  onClick={() => {
                    setLocale(l.id);
                    setOpen(false);
                  }}
                  className={cx(
                    "flex min-h-12 w-full items-center rounded-[var(--radius-button)] px-3 py-2 text-left",
                    "text-[length:var(--text-body)] leading-[var(--leading-body)]",
                    l.id === locale ? "bg-ground font-medium" : "hover:bg-ground",
                  )}
                >
                  {l.label}
                </button>
              </li>
            ) : (
              <li
                key={l.id}
                className="flex min-h-12 flex-col justify-center px-3 py-2 text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted"
              >
                {l.label}
                <span className="text-[length:var(--text-label)] leading-[var(--leading-label)]">
                  {t("language.soon")}
                </span>
              </li>
            ),
          )}
        </ul>
      ) : null}
    </div>
  );
}
