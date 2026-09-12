"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { FactsAsOf } from "@/components/ui/FactsAsOf";
import { HelpLineBrief } from "@/components/screens/Help";
import { MoneyRow } from "@/components/ui/MoneyRow";
import { cushionTarget } from "@/lib/costs";
import { hkd } from "@/lib/format";
import { getPersona, needsCommunityReview } from "@/lib/personas";
import { runReport, topHelpLinesFor } from "@/lib/report";
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
    <main className="py-6 pb-28 md:pb-10">
      <Column className="flex flex-col gap-5">
        <header className="flex flex-col gap-1">
          <Label>{t("final.title", { name: run.name })}</Label>
          <h1
            className={
              report.verdict.tone === "atRisk"
                ? "m-0 text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold text-warn"
                : "m-0 text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold"
            }
          >
            <span aria-hidden="true" className="mr-2">
              {report.verdict.glyph}
            </span>
            {t(`tier.${report.verdict.tier}.title`)}
          </h1>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t(`tier.${report.verdict.tier}.blurb`)}
          </p>
          {report.monthsPlayed < report.months ? (
            <Label>{t("final.stopped", { months: report.monthsPlayed })}</Label>
          ) : null}
        </header>

        {/* The heading is a heading, not a caption inside the box it introduces, and the
            rules are numbered because "three things" that arrive as three identical
            blocks are not visibly three things. */}
        <section className="flex flex-col gap-2.5">
          <h2 className="m-0 text-[length:var(--text-section)] leading-[var(--leading-section)] font-semibold">
            {t("final.rules")}
          </h2>
          <Card>
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
              {report.rules.map((rule, i) => (
                <li key={rule.id} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="w-4 shrink-0 text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium text-muted"
                  >
                    {i + 1}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium">
                      {rule.rule}
                    </span>
                    <Label>{rule.title}</Label>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </section>

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
            note={t("final.cushionRule", { amount: hkd(cushionTarget(run), locale) })}
          />
          {/* The same money said the way a person actually asks about it. "HK$ 3,100"
              is a fact; "about eleven days" is the answer to the question somebody is
              really holding, which is how long they could go if the pay stopped. */}
          <MoneyRow
            label={t("final.wouldLast")}
            value={
              report.cushionDays < 1
                ? t("final.lastNone")
                : report.cushionDays <= 60
                  ? tn("final.lastDays", report.cushionDays)
                  : tn("final.lastMonths", Math.round(report.cushionDays / 30))
            }
            note={t("final.wouldLastNote")}
          />
        </Card>

        {/* The two or three that match what went wrong this year, not the directory,
            and each said in three lines rather than seven. Opening every service to
            every life made this section twelve cards long — a filing cabinet handed to
            somebody who has just finished a hard year. The hours, the caveats and the
            web addresses are on the Help screen, one tap away, which is where a person
            goes once they have decided to call. */}
        <section className="flex flex-col gap-4">
          <Label>{t("final.help")}</Label>
          {topHelpLinesFor(run).map((line) => (
            <HelpLineBrief key={line.id} line={line} />
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
