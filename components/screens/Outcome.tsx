"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { CousinCard } from "@/components/ui/CousinCard";
import { MoneyRow } from "@/components/ui/MoneyRow";
import { getCard } from "@/lib/cards";
import { hkd } from "@/lib/format";
import { getPersona } from "@/lib/personas";
import type { MoneyEffect, RunState } from "@/lib/types";

/**
 * What happened, and why.
 *
 * The order matters: what happened, then what it cost, then the lesson, then the signs
 * that were there all along. Putting the tells last is deliberate — they are useless
 * before a decision, because reading a list of scam signs is not the same skill as
 * recognising one in a message that is trying to look ordinary.
 *
 * Nothing here says "you should have". If the trap won, the trap is the subject of the
 * sentence.
 */
export function Outcome({
  run,
  cardId,
  outcomeIdx,
  onContinue,
}: {
  run: RunState;
  cardId: string;
  outcomeIdx: number;
  onContinue: () => void;
}) {
  const { t, tn, locale } = useI18n();
  const [showGuide, setShowGuide] = useState(true);

  const card = getCard(cardId);
  const resolved = run.resolved[cardId];
  const choice = card?.choices.find((c) => c.id === resolved?.choiceId);
  const outcome = choice?.outcomes[outcomeIdx];
  if (!card || !outcome) return null;

  const persona = getPersona(run.personaId);
  const tells = outcome.tells ?? (card.kind === "trap" ? card.pitch?.tells : undefined) ?? [];

  return (
    <main className="py-6 pb-28 md:pt-20 md:pb-10">
      <Column className="flex flex-col gap-4">
        <Label>{card.title}</Label>

        <Card className="flex flex-col gap-3">
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {outcome.consequence}
          </p>
          <Deltas effect={outcome.effect} locale={locale} t={t} tn={tn} />
        </Card>

        {outcome.lesson ? (
          <Card className="flex flex-col gap-1">
            <Label>{t("outcome.lesson")}</Label>
            <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
              {outcome.lesson}
            </p>
          </Card>
        ) : null}

        {tells.length > 0 ? (
          <Card className="flex flex-col gap-2">
            <Label>{t("outcome.tells")}</Label>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {tells.map((tell) => (
                <li
                  key={tell}
                  className="text-[length:var(--text-body)] leading-[var(--leading-body)] before:mr-2 before:content-['·']"
                >
                  {t(`tell.${tell}`)}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {showGuide && outcome.applied === false ? (
          <CousinCard
            name={t("guide.says", { name: persona.guideName })}
            onDismiss={() => setShowGuide(false)}
            dismissLabel={t("guide.dismiss")}
          >
            <p className="m-0">{t("guide.afterMiss")}</p>
          </CousinCard>
        ) : null}

        <Button kind="primary" onClick={onContinue}>
          {t("outcome.continue")}
        </Button>
      </Column>
    </main>
  );
}

/**
 * The money that moved, as plain rows.
 *
 * Only what actually changed. A row reading "HK$ 0" teaches nothing and makes the rows
 * that matter harder to find.
 */
function Deltas({
  effect,
  locale,
  t,
  tn,
}: {
  effect: MoneyEffect;
  locale: "en" | "tl" | "id";
  t: (key: string, vars?: Record<string, string | number>) => string;
  tn: (key: string, count: number, vars?: Record<string, string | number>) => string;
}) {
  const rows: { label: string; value: string; atRisk?: boolean; glyph?: string }[] = [];

  if (effect.cash) {
    rows.push({
      label: t("outcome.cash"),
      value: hkd(effect.cash, locale),
      glyph: effect.cash > 0 ? "▲" : "▼",
      atRisk: effect.cash < 0,
    });
  }
  if (effect.savings) {
    rows.push({
      label: t("outcome.cushion"),
      value: hkd(effect.savings, locale),
      glyph: effect.savings > 0 ? "▲" : "▼",
    });
  }
  if (effect.addDebt) {
    rows.push({
      label: t("outcome.newDebt"),
      value: hkd(effect.addDebt.balance, locale),
      glyph: "▼",
      atRisk: true,
    });
  }
  if (effect.payDebt) {
    rows.push({ label: t("outcome.paidOff"), value: hkd(effect.payDebt.amount, locale), glyph: "▲" });
  }
  if (effect.income) {
    rows.push({
      label: t("outcome.income"),
      value: tn("outcome.perMonth", effect.income.months, {
        amount: hkd(effect.income.monthly, locale),
      }),
      glyph: effect.income.monthly > 0 ? "▲" : "▼",
      atRisk: effect.income.monthly < 0,
    });
  }
  if (effect.fixed) {
    rows.push({
      label: t(`outcome.fixed.${effect.fixed.field}`),
      value: tn("outcome.perMonth", effect.fixed.months ?? 0, {
        amount: hkd(effect.fixed.monthly, locale),
      }),
      glyph: effect.fixed.monthly > 0 ? "▼" : "▲",
      atRisk: effect.fixed.monthly > 0,
    });
  }

  if (rows.length === 0) {
    return (
      <p className="m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
        {t("outcome.noChange")}
      </p>
    );
  }

  return (
    <div className="flex flex-col border-t border-line pt-2">
      {rows.map((row) => (
        <MoneyRow
          key={row.label}
          label={row.label}
          value={row.value}
          glyph={row.glyph}
          atRisk={row.atRisk}
        />
      ))}
    </div>
  );
}
