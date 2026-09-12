"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { FactsAsOf } from "@/components/ui/FactsAsOf";
import { FACTS_AS_OF, allFacts } from "@/lib/facts";
import { HELP_LINE_IDS, helpLine } from "@/lib/helpLines";
import { asOfDate, hkd, pct, siteName } from "@/lib/format";
import type { Fact, Locale } from "@/lib/types";

/**
 * Where every figure came from, and what this game is.
 *
 * This used to sit on the Help screen, between somebody who was frightened and a phone
 * number. It is not help. It is a promise: every figure in this product traces to a
 * dated page on a government or organisation website, and anybody who thinks one is
 * wrong can open the same page and say so. That promise belongs next to the credits.
 *
 * The services are listed here a second time — not with their phone numbers, which are
 * on the Help screen where they are useful, but with the date each one was last read off
 * its own source. A number that was right two years ago is a number that can send
 * somebody to a disconnected line on the day they needed it.
 */
export function Sources({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
  const { t, locale } = useI18n();

  return (
    <main className="py-6 pb-28 md:pb-10">
      <Column className="flex flex-col gap-6">
        <button
          type="button"
          onClick={onBack}
          className="self-start min-h-12 text-[length:var(--text-body)] leading-[var(--leading-body)] underline underline-offset-4"
        >
          {backLabel}
        </button>

        <section className="flex flex-col gap-3">
          <h1 className="m-0 text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold">
            {t("help.figures")}
          </h1>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted">
            {t("sources.sub")}
          </p>
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
          <h2 className="m-0 text-[length:var(--text-section)] leading-[var(--leading-section)] font-semibold">
            {t("sources.services")}
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {HELP_LINE_IDS.map((id) => {
              const line = helpLine(id);
              return (
                <li
                  key={id}
                  className="flex flex-col gap-0.5 border-b border-line py-3 last:border-b-0"
                >
                  <span className="text-[length:var(--text-body)] leading-[var(--leading-body)]">
                    {t(`helpLine.${id}.org`)}
                  </span>
                  <Label>{t("help.factAsOf", { date: asOfDate(line.checkedOn, locale) })}</Label>
                  <a
                    href={line.source}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[length:var(--text-label)] leading-[var(--leading-label)] underline underline-offset-4 [overflow-wrap:anywhere]"
                  >
                    {siteName(line.source)}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-2 border-t border-line pt-5">
          <h2 className="m-0 text-[length:var(--text-section)] leading-[var(--leading-section)] font-semibold">
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
      </Column>
    </main>
  );
}

/** A figure, what it means, when it was true, and where it came from. */
function FactRow({ fact, locale }: { fact: Fact; locale: Locale }) {
  const { t, tn } = useI18n();
  return (
    <div className="flex flex-col gap-0.5 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <Label>{t(`fact.${fact.id}.label`)}</Label>
      <span className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
        {factValue(fact, locale, t, tn)}
      </span>
      <Label>{t("help.factAsOf", { date: asOfDate(fact.asOf, locale) })}</Label>
      <a
        href={fact.source.url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-[length:var(--text-label)] leading-[var(--leading-label)] underline underline-offset-4 [overflow-wrap:anywhere]"
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
