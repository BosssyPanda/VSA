"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { CardView } from "@/components/screens/CardView";
import { BorrowSheet, RepaySheet, SetAsideSheet } from "@/components/screens/MoneySheets";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Bar, StepBar } from "@/components/ui/Bar";
import { Figure } from "@/components/ui/Figure";
import { ArrearsNote } from "@/components/ui/ArrearsNote";
import { MoneyRow } from "@/components/ui/MoneyRow";
import { cushionTarget } from "@/lib/costs";
import { debtService, debtTotal, worstArrears } from "@/lib/debt";
import { hkd } from "@/lib/format";
import { getPersona } from "@/lib/personas";
import type { RunApi } from "@/hooks/useRun";

/**
 * The month.
 *
 * The eight sections of the design contract, in its order, and nothing else. The order
 * is the argument: where I am, what I have, what I owe, what I have put by, what is
 * happening, what I can do. A person who reads only the first four lines should already
 * know whether this month is going to work.
 *
 * On a computer the first four become a rail that stays put while the situation and the
 * actions scroll. Same sections, same order, same words — a desktop gets room, not
 * material.
 */
export function Month({ api }: { api: RunApi }) {
  const { t, tn, locale } = useI18n();
  const [sheet, setSheet] = useState<"none" | "aside" | "borrow" | "repay">("none");
  const { run, context, unresolved, canClose } = api;
  if (!run || !context) return null;

  const persona = getPersona(run.personaId);
  const owed = debtTotal(run);
  const due = debtService(run);
  const arrears = worstArrears(run);
  const target = cushionTarget(run);
  const card = unresolved[0];

  const whereIAm = (
    <section className="flex flex-col gap-2">
      <Label>{t("month.where")}</Label>
      <h1 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
        {t("month.heading", { name: run.name, month: run.month, total: run.months })}
      </h1>
      <StepBar step={run.month - 1} steps={run.months} />
    </section>
  );

  const moneyNow = (
    <Card className="flex flex-col gap-1">
      <Label>{t("month.cash")}</Label>
      <Figure>{hkd(run.cash, locale)}</Figure>
    </Card>
  );

  const whatIOwe = (
    <Card className="flex flex-col gap-2">
      <MoneyRow
        label={t("month.owed")}
        value={hkd(owed, locale)}
        note={owed > 0 ? t("month.dueThisMonth", { amount: hkd(due, locale) }) : t("month.owedNone")}
        atRisk={arrears > 0}
        glyph={arrears > 0 ? "▼" : undefined}
      />
      {arrears > 0 ? <ArrearsNote>{tn("month.arrears", arrears)}</ArrearsNote> : null}
      {owed > 0 ? (
        <Button kind="secondary" onClick={() => setSheet("repay")}>
          {t("month.repay")}
        </Button>
      ) : null}
    </Card>
  );

  const cushion = (
    <Card className="flex flex-col gap-2">
      <MoneyRow
        label={t("month.cushion")}
        value={t("month.cushionOf", {
          saved: hkd(run.savings, locale),
          target: hkd(target, locale),
        })}
      />
      <Bar value={run.savings} max={target} />
      <Label>{t("month.cushionRule")}</Label>
    </Card>
  );

  const situation = (
    <section className="flex flex-col gap-3">
      <Label>{t("month.today")}</Label>
      {card ? (
        <CardView card={card} context={context} onChoose={(choiceId) => api.choose(card.id, choiceId)} />
      ) : (
        <Card>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("month.nothingLeft")}
          </p>
        </Card>
      )}
    </section>
  );

  const actions = (
    <section className="flex flex-col gap-2.5">
      <Button kind="primary" disabled={!canClose} onClick={api.closeMonth}>
        {t("month.close")}
      </Button>
      {!canClose ? <Label>{t("month.closeBlocked")}</Label> : null}
      <Button kind="secondary" onClick={() => setSheet("aside")}>
        {t("month.setAside")}
      </Button>
      <Button kind="quiet" onClick={() => setSheet("borrow")}>
        {t("month.borrow")}
      </Button>
    </section>
  );

  return (
    <main className="py-6 pb-28 md:pt-20 md:pb-10">
      <div className="mx-auto flex w-full max-w-[var(--w-column)] flex-col gap-5 px-5 md:max-w-[var(--w-column-wide)] lg:max-w-[944px] lg:flex-row lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:w-[var(--w-rail)] lg:shrink-0">
          {whereIAm}
          {moneyNow}
          {whatIOwe}
          {cushion}
        </div>
        <div className="flex flex-col gap-5 lg:w-[var(--w-column-wide)]">
          {situation}
          {actions}
        </div>
      </div>

      <SetAsideSheet
        open={sheet === "aside"}
        onClose={() => setSheet("none")}
        run={run}
        onConfirm={(amount) => {
          api.putAside(amount);
          setSheet("none");
        }}
      />
      <BorrowSheet
        open={sheet === "borrow"}
        onClose={() => setSheet("none")}
        onConfirm={(kind, amount) => {
          api.borrow(kind, amount);
          setSheet("none");
        }}
      />
      <RepaySheet
        open={sheet === "repay"}
        onClose={() => setSheet("none")}
        run={run}
        guideName={persona.guideName}
        onConfirm={(debtId, amount) => {
          api.repay(debtId, amount);
          setSheet("none");
        }}
      />
    </main>
  );
}
