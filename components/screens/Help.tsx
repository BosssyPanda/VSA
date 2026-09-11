"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { FactsAsOf } from "@/components/ui/FactsAsOf";
import { FACTS_AS_OF, allFacts } from "@/lib/facts";
import { HELP_LINE_IDS, helpLine } from "@/lib/helpLines";
import { asOfDate, hkd, pct, siteName } from "@/lib/format";
import { readyLocales } from "@/lib/i18n";
import type { Fact, HelpLine, Locale } from "@/lib/types";

/**
 * Help, and where every number came from.
 *
 * Not an About page. The phone numbers are the most useful thing in this product for
 * somebody who is actually in trouble, so they are a tab rather than a footer, and they
 * are also repeated inside the cards and on the final statement.
 *
 * The figures list is here because a game that quotes the law at you owes you the
 * source. Every row has the number, the date it was true, and a link to the page it was
 * read off — which is also what makes the numbers falsifiable by anybody who thinks one
 * is wrong.
 */
export function Help({ onBack, backLabel }: { onBack?: () => void; backLabel?: string }) {
  const { t, locale, setLocale } = useI18n();
  const locales = readyLocales();

  return (
    <main className="py-6 pb-28 md:pt-20 md:pb-10">
      <Column className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h1 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
            {t("help.title")}
          </h1>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted">
            {t("help.sub")}
          </p>
          {HELP_LINE_IDS.map((id) => (
            <HelpLineCard key={id} line={helpLine(id)} />
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
            {t("help.figures")}
          </h2>
          <FactsAsOf
            date={FACTS_AS_OF}
            locale={locale}
            label={(vars) => t("title.figuresAsOf", vars)}
          />
          <Card className="flex flex-col gap-3">
            {allFacts().map((fact) => (
              <FactRow key={fact.id} fact={fact} locale={locale} />
            ))}
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
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
                    : "min-h-12 rounded-[var(--radius-button)] border border-line bg-card px-4 py-3 text-[length:var(--text-body)]"
                }
              >
                {l.label}
              </button>
            ))}
          </div>
          {locales.length < 2 ? <Label>{t("title.languageMore")}</Label> : null}
        </section>

        <section className="flex flex-col gap-2 border-t border-line pt-4">
          <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
            {t("help.about")}
          </h2>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("title.privacy")}
          </p>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("help.clearing")}
          </p>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("help.unreviewed")}
          </p>
          <Label>{t("title.notAdvice")}</Label>
        </section>

        {onBack && backLabel ? (
          <Button kind="secondary" onClick={onBack}>
            {backLabel}
          </Button>
        ) : null}
      </Column>
    </main>
  );
}

/**
 * One place to go, with the number tappable.
 *
 * `tel:` because the person reading this is on a phone and may be frightened, and the
 * distance between reading a number and dialling it should be one tap. The caveat line
 * is shown whenever the source page carries one — "this line is for advice, not for
 * reporting a crime" is exactly the kind of thing somebody needs before they call.
 */
export function HelpLineCard({ line }: { line: HelpLine }) {
  const { t } = useI18n();
  return (
    <Card className="flex flex-col gap-1.5">
      <h3 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
        {t(`helpLine.${line.id}.org`)}
      </h3>
      <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
        {t(`helpLine.${line.id}.what`)}
      </p>
      {line.phone ? (
        <a
          href={`tel:${line.phone.replace(/\s/g, "")}`}
          className="inline-flex min-h-12 items-center text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium text-accent underline underline-offset-4"
        >
          {line.phone}
        </a>
      ) : null}
      {line.hours ? <Label>{t(`helpLine.${line.id}.hours`)}</Label> : null}
      {line.note ? <Label>{t(`helpLine.${line.id}.note`)}</Label> : null}
      {line.url ? (
        <a
          href={line.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-accent underline underline-offset-4 [overflow-wrap:anywhere]"
        >
          {siteName(line.url)}
        </a>
      ) : null}
    </Card>
  );
}

/** A figure, what it means, when it was true, and where it came from. */
function FactRow({ fact, locale }: { fact: Fact; locale: Locale }) {
  const { t, tn } = useI18n();
  return (
    <div className="flex flex-col gap-0.5 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <Label>{t(`fact.${fact.id}.label`)}</Label>
      <span className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
        {factValue(fact, locale, t, tn)}
      </span>
      <Label>{t("help.factAsOf", { date: asOfDate(fact.asOf, locale) })}</Label>
      <a
        href={fact.source.url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-accent underline underline-offset-4"
      >
        {fact.source.name}
      </a>
    </div>
  );
}

/** A number written the way its unit is written, never as a bare figure. */
function factValue(
  fact: Fact,
  locale: Locale,
  t: (key: string, vars?: Record<string, string | number>) => string,
  tn: (key: string, count: number, vars?: Record<string, string | number>) => string,
): string {
  switch (fact.unit) {
    case "HKD":
      return hkd(fact.value, locale);
    case "HKD/hr":
      return t("unit.perHour", { amount: hkd(fact.value, locale) });
    case "HKD/month":
      return t("unit.perMonth", { amount: hkd(fact.value, locale) });
    case "pct":
      return pct(fact.value);
    case "years":
      return tn("unit.years", fact.value);
    case "months":
      return tn("unit.months", fact.value);
    case "people":
      return t("unit.people", { count: fact.value.toLocaleString("en-HK") });
  }
}
