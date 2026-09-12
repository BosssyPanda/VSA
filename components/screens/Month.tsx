"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { CardView } from "@/components/screens/CardView";
import { BorrowSheet, RepaySheet, SetAsideSheet } from "@/components/screens/MoneySheets";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { StepBar } from "@/components/ui/Bar";
import { MoneyModule } from "@/components/ui/MoneyModule";
import { debtTotal } from "@/lib/debt";
import { getPersona } from "@/lib/personas";
import type { RunApi } from "@/hooks/useRun";

/**
 * The month.
 *
 * Where you are, your money, today's situation, what you decide. Four sections in that
 * order and nothing else, because a person who reads only the first two should already
 * know whether this month is going to work.
 *
 * On a computer the first two become a rail that stays put while the situation and the
 * decision scroll. Same sections, same order, same words — a desktop gets room, not
 * material, so somebody on a library computer and somebody on a phone can talk about the
 * same screen.
 *
 * "Finish the month" is primary only when it is the thing to do. While a card is still
 * on the table it is the quieter of the two, because answering the card is the task and
 * leaving it is the exit. When there is nothing left to answer the button is absent
 * altogether and one line says what would bring it back — this product has no
 * greyed-out controls.
 */
export function Month({ api }: { api: RunApi }) {
  const { t } = useI18n();
  const [sheet, setSheet] = useState<"none" | "aside" | "borrow" | "repay">("none");
  const { run, context, unresolved, canClose } = api;
  if (!run || !context) return null;

  const persona = getPersona(run.personaId);
  const card = unresolved[0];

  const whereIAm = (
    <section className="flex flex-col gap-2">
      <h1 className="m-0 text-[length:var(--text-section)] leading-[var(--leading-section)] font-semibold">
        {t("month.heading", { name: run.name, month: run.month, total: run.months })}
      </h1>
      <StepBar step={run.month - 1} steps={run.months} />
    </section>
  );

  const situation = (
    <section className="flex flex-col gap-3">
      <Label>{t("month.today")}</Label>
      {card ? (
        <CardView
          key={card.id}
          card={card}
          context={context}
          playerName={run.name}
          onChoose={(choiceId) => api.choose(card.id, choiceId)}
        />
      ) : (
        <Card>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("month.nothingLeft")}
          </p>
        </Card>
      )}
    </section>
  );

  /*
   * Moving money is a side action, and it belongs below the month's actual task.
   *
   * These three were inside the money module, which read well and pushed today's
   * situation past the fold on a 390px phone — the one thing the screen exists to show,
   * off the bottom of it, behind three controls most months do not need. Nothing is
   * hidden and nothing is greyed: they are simply after the decision rather than in
   * front of it.
   */
  const moving = (
    <section className="flex flex-col gap-2.5 border-t border-line pt-5">
      <Label>{t("month.moveMoney")}</Label>
      <Button kind="secondary" onClick={() => setSheet("aside")}>
        {t("month.setAside")}
      </Button>
      {debtTotal(run) > 0 ? (
        <Button kind="secondary" onClick={() => setSheet("repay")}>
          {t("month.repay")}
        </Button>
      ) : null}
      <Button kind="secondary" onClick={() => setSheet("borrow")}>
        {t("month.borrow")}
      </Button>
    </section>
  );

  const finish = canClose ? (
    <Button kind={card ? "secondary" : "primary"} onClick={api.closeMonth}>
      {t("month.close")}
    </Button>
  ) : (
    <p className="m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
      {t("month.closeBlocked")}
    </p>
  );

  return (
    <main className="py-6 pb-28 md:pb-10">
      <div className="mx-auto flex w-full max-w-[var(--w-column)] flex-col gap-5 px-5 md:max-w-[var(--w-column-wide)] lg:max-w-[var(--w-shell)] lg:flex-row lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:w-[var(--w-rail)] lg:shrink-0">
          {whereIAm}
          <MoneyModule run={run} />
          <div className="hidden lg:block">{moving}</div>
        </div>
        <div className="flex flex-col gap-5 lg:w-[var(--w-column-wide)]">
          {situation}
          {finish}
          <div className="lg:hidden">{moving}</div>
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
        onConfirm={(debtId, amount) => {
          api.repay(debtId, amount);
          setSheet("none");
        }}
      />
    </main>
  );
}
