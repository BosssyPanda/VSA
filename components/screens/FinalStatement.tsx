"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { FactsAsOf } from "@/components/ui/FactsAsOf";
import { HelpLineCard } from "@/components/screens/Help";
import { MoneyRow } from "@/components/ui/MoneyRow";
import { hkd } from "@/lib/format";
import { getPersona, needsCommunityReview } from "@/lib/personas";
import { runReport } from "@/lib/report";
import { buildShareText, shareText, type ShareOutcome } from "@/lib/share";
import type { RunState } from "@/lib/types";

/**
 * The end of the year, which is the actual product.
 *
 * Twelve months of decisions are worth nothing if somebody walks away with a feeling
 * instead of something they can repeat. So the last screen is three rules of thumb,
 * what the traps took, what protected them, and the phone numbers — in that order, and
 * with no score anywhere.
 *
 * Rules of thumb rather than principles is the one evidence-backed choice in the whole
 * teaching model: Drexler, Fischer and Schoar (2014) found that people with little
 * formal financial schooling act on rules and do not act on principles. Three is the
 * number a tired person keeps.
 */
export function FinalStatement({
  run,
  onPlayAgain,
}: {
  run: RunState;
  onPlayAgain: () => void;
}) {
  const { t, tn, locale } = useI18n();
  const [shared, setShared] = useState<ShareOutcome | null>(null);
  const report = runReport(run);
  const persona = getPersona(run.personaId);

  return (
    <main className="py-6 pb-28 md:pt-20 md:pb-10">
      <Column className="flex flex-col gap-5">
        <header className="flex flex-col gap-1">
          <Label>{t("final.title", { name: run.name })}</Label>
          <p
            className="m-0 text-[length:var(--text-figure)] leading-[var(--leading-figure)] font-semibold"
            style={{ color: report.verdict.hex }}
          >
            <span aria-hidden="true" className="mr-2">
              {report.verdict.glyph}
            </span>
            {t(`tier.${report.verdict.tier}.title`)}
          </p>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t(`tier.${report.verdict.tier}.blurb`)}
          </p>
          {report.monthsPlayed < report.months ? (
            <Label>{t("final.stopped", { months: report.monthsPlayed })}</Label>
          ) : null}
        </header>

        <Card className="flex flex-col gap-1">
          <Label>{t("final.rules")}</Label>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {report.rules.map((rule) => (
              <li key={rule.id} className="flex flex-col gap-0.5">
                <span className="text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium">
                  {rule.rule}
                </span>
                <Label>{rule.title}</Label>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="flex flex-col">
          <MoneyRow
            label={t("final.trapCost")}
            value={hkd(report.trapCost, locale)}
            note={
              report.trapHits.length > 0
                ? tn("final.trapCount", report.trapHits.length)
                : t("final.noTraps")
            }
            atRisk={report.trapCost > 0}
            glyph={report.trapCost > 0 ? "▼" : undefined}
          />
          {report.interestPaid > 0 ? (
            <MoneyRow
              label={t("final.interest")}
              value={hkd(report.interestPaid, locale)}
              note={t("final.interestNote")}
            />
          ) : null}
          {report.trapsSpotted > 0 ? (
            <MoneyRow
              label={t("final.spotted")}
              value={tn("final.spottedCount", report.trapsSpotted)}
              glyph="▲"
            />
          ) : null}
          <MoneyRow
            label={t("final.cushion")}
            value={hkd(run.savings, locale)}
            note={t("final.cushionMonths", { months: Math.round(report.cushionMonths * 10) / 10 })}
          />
        </Card>

        <section className="flex flex-col gap-3">
          <Label>{t("final.help")}</Label>
          {report.helpLines.map((line) => (
            <HelpLineCard key={line.id} line={line} />
          ))}
        </section>

        <div className="flex flex-col gap-2.5">
          <Button
            kind="secondary"
            onClick={async () => setShared(await shareText(buildShareText(run, t, locale)))}
          >
            {t("final.share")}
          </Button>
          {shared ? <Label>{t(`final.shared.${shared}`)}</Label> : null}
          <Button kind="primary" onClick={onPlayAgain}>
            {t("final.again")}
          </Button>
        </div>

        <footer className="flex flex-col gap-1 border-t border-line pt-4">
          {needsCommunityReview(persona.id) ? <Label>{t("final.unreviewed")}</Label> : null}
          <FactsAsOf
            date={report.factsAsOf}
            locale={locale}
            label={(vars) => t("title.figuresAsOf", vars)}
          />
          <Label>{t("title.notAdvice")}</Label>
        </footer>
      </Column>
    </main>
  );
}
