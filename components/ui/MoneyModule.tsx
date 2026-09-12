"use client";

import { useI18n } from "@/components/I18nProvider";
import { ArrearsNote } from "@/components/ui/ArrearsNote";
import { Bar } from "@/components/ui/Bar";
import { Label } from "@/components/ui/Card";
import { Figure } from "@/components/ui/Figure";
import { cushionTarget, nextCushionStep } from "@/lib/costs";
import { debtService, debtTotal, worstArrears } from "@/lib/debt";
import { hkd } from "@/lib/format";
import type { RunState } from "@/lib/types";

/**
 * Your money: four numbers, one module.
 *
 * They were three white rounded boxes — money now, what you owe, money set aside — and
 * three boxes is a claim that these are three unrelated topics. They are the opposite of
 * unrelated: the only question this screen has to answer is whether what you have covers
 * what is due, and that is a comparison a person cannot make across three borders and
 * two gaps. One border, one set of labels, one place to look.
 *
 * The big figure is money in hand, and it is the only figure on the screen at that size.
 * Two competing 34px numbers is the fintech-dashboard failure: the eye lands nowhere and
 * somebody tired reads neither.
 *
 * **Money set aside is never drawn as a failure.** "HK$ 0 of HK$ 5,100" is true and
 * demoralising, and demoralising the player is not a teaching method — it is the surest
 * way to lose the person who most needed to finish the month. The bar fills toward the
 * next quarter of a month of pay, which is reachable this month; the full rule of thumb
 * is named beside it in words instead of looming over it as a denominator.
 */
export function MoneyModule({ run }: { run: RunState }) {
  const { t, tn, locale } = useI18n();
  const owed = debtTotal(run);
  const due = debtService(run);
  const arrears = worstArrears(run);
  const step = nextCushionStep(run);

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <Label>{t("month.cash")}</Label>
        <Figure>{hkd(run.cash, locale)}</Figure>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-3">
        <Label>{t("month.due")}</Label>
        <Label>{t("month.owed")}</Label>
        <span className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
          {hkd(due, locale)}
        </span>
        {/* The glyph is not decoration and it is not optional. Colour is never the only
            channel in this product, and a figure painted red with no second signal is
            invisible to a red-green reader and to anybody on a washed-out screen in the
            sun. `qa:a11y` fails the build on a warn-coloured element carrying neither a
            letter nor one of ▲ ▬ ▼. */}
        <span
          className={
            arrears > 0
              ? "text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium text-warn"
              : "text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium"
          }
        >
          {arrears > 0 ? <span className="mr-1.5">▼</span> : null}
          {hkd(owed, locale)}
        </span>
      </div>
      {arrears > 0 ? <ArrearsNote>{tn("month.arrears", arrears)}</ArrearsNote> : null}

      <div className="flex flex-col gap-1.5 border-t border-line pt-3">
        <Label>{t("month.cushion")}</Label>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
            {hkd(run.savings, locale)}
          </span>
          <Label>
            {step.full
              ? t("month.cushionDone")
              : t("month.cushionNext", { amount: hkd(step.target, locale) })}
          </Label>
        </div>
        <Bar value={run.savings} max={step.target} />
        <Label>
          {t("month.cushionRuleOf", { amount: hkd(cushionTarget(run), locale) })}
        </Label>
      </div>

    </section>
  );
}
