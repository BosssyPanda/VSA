"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Column } from "@/components/ui/Column";
import { readyLocales } from "@/lib/i18n";
import { asOfDate } from "@/lib/format";

/**
 * The first screen.
 *
 * It answers three questions before anything else: what this is, what it will cost
 * you (nothing, and no account), and how old the numbers are. The audience for this
 * product is asked for money, data and trust by a dozen apps a week; the opening
 * screen is where this one says what it does not want.
 *
 * The facts date is hard-coded until `lib/facts.ts` lands in M1, and it is on screen
 * from the first commit so that no build can ever quietly show undated figures.
 */
const FACTS_AS_OF = "2026-03-01";

export function Title() {
  const { t, locale, setLocale } = useI18n();
  const locales = readyLocales();

  return (
    <main className="flex min-h-screen flex-col justify-between py-8">
      <Column className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-[length:var(--text-figure)] leading-[var(--leading-figure)] font-semibold">
            {t("app.name")}
          </h1>
          <p className="text-[length:var(--text-title)] leading-[var(--leading-title)]">
            {t("app.tagline")}
          </p>
          <p className="text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted">
            {t("title.sub")}
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Button kind="primary">{t("title.start")}</Button>
          <Button kind="secondary">{t("title.help")}</Button>
        </div>

        <section className="flex flex-col gap-2" aria-label={t("title.language")}>
          <h2 className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
            {t("title.language")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {locales.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLocale(l.id)}
                aria-pressed={l.id === locale}
                className={
                  l.id === locale
                    ? "min-h-12 rounded-[var(--radius-button)] bg-accent-tint px-4 py-3 text-[length:var(--text-body)] font-medium text-accent"
                    : "min-h-12 rounded-[var(--radius-button)] border border-line bg-card px-4 py-3 text-[length:var(--text-body)] text-ink"
                }
              >
                {l.label}
              </button>
            ))}
          </div>
          {locales.length < 2 ? (
            <p className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
              {t("title.languageMore")}
            </p>
          ) : null}
        </section>
      </Column>

      <Column className="mt-10">
        <footer className="flex flex-col gap-1 border-t border-line pt-4 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
          <p>{t("title.figuresAsOf", { date: asOfDate(FACTS_AS_OF, locale) })}</p>
          <p>{t("title.privacy")}</p>
          <p>{t("title.notAdvice")}</p>
        </footer>
      </Column>
    </main>
  );
}
