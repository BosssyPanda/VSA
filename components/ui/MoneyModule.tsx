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
 * Your money: one module, and the one subtraction that decides the month.
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
 * **The shortfall is stated, not implied.** The module used to print HK$ 620 in hand and
 * HK$ 915 due and leave the subtraction to the reader — on the primary screen of a
 * product written for people who may have low numeracy, under money stress, in a third
 * language. It is one row now, and it reads either way round: "HK$ 640 left" or
 * "HK$ 295 short". No red and no warning glyph — being short this month is a fact about
 * the month, not a verdict on the person, and the row says the same thing in both
 * directions so its presence never announces bad news on its own.
 *
 * **Money set aside is never drawn as a failure.** "HK$ 0 of HK$ 5,100" is true and
 * demoralising, and demoralising the player is not a teaching method — it is the surest
 * way to lose the person who most needed to finish the month. The bar fills toward the
 * next quarter of a month of pay, which is reachable this month; the full rule of thumb
 * is named beside it in words instead of looming over it as a denominator.
 *
 * **Three measures, not two.** This module is 350px wide on a phone, 520px in the tablet
 * column, and 360px again in the desktop rail. Stacking a label above its figure reads
 * well at 350 and leaves the card hollow at 520, so the pair becomes a row for the
 * middle measure only — hence `md:` on and `lg:` off again, which is the container
 * width changing rather than a breakpoint being fought.
 */

/** A label and its amount: stacked on a phone and in the desktop rail, a row between. */
function MoneyLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:justify-between md:gap-3 lg:flex-col lg:items-stretch lg:gap-0.5">
      <Label>{label}</Label>
      <span className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold md:text-right lg:text-left">
        {children}
      </span>
    </div>
  );
}

export function MoneyModule({ run }: { run: RunState }) {
  const { t, tn, locale } = useI18n();
  const owed = debtTotal(run);
  const due = debtService(run);
  const arrears = worstArrears(run);
  const step = nextCushionStep(run);
  const after = run.cash - due;

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <Label>{t("month.cash")}</Label>
        <Figure>{hkd(run.cash, locale)}</Figure>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-3">
        <MoneyLine label={t("month.due")}>{hkd(due, locale)}</MoneyLine>
        <MoneyLine label={t("month.after")}>
          {after < 0
            ? t("month.afterShort", { amount: hkd(Math.abs(after), locale) })
            : t("month.afterLeft", { amount: hkd(after, locale) })}
        </MoneyLine>
        <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:justify-between md:gap-3 lg:flex-col lg:items-stretch lg:gap-0.5">
          <Label>{t("month.owed")}</Label>
          {/* The glyph is not decoration and it is not optional. Colour is never the only
              channel in this product, and a figure painted red with no second signal is
              invisible to a red-green reader and to anybody on a washed-out screen in the
              sun. `qa:a11y` fails the build on a warn-coloured element carrying neither a
              letter nor one of ▲ ▬ ▼. */}
          <span
            className={
              arrears > 0
                ? "text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold text-warn md:text-right lg:text-left"
                : "text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold md:text-right lg:text-left"
            }
          >
            {arrears > 0 ? <span className="mr-1.5">▼</span> : null}
            {hkd(owed, locale)}
          </span>
        </div>
      </div>
      {arrears > 0 ? <ArrearsNote>{tn("month.arrears", arrears)}</ArrearsNote> : null}

      <div className="flex flex-col gap-1.5 border-t border-line pt-3">
        <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:justify-between md:gap-3 lg:flex-col lg:items-stretch lg:gap-0.5">
          <Label>{t("month.cushion")}</Label>
          <span className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold md:text-right lg:text-left">
            {hkd(run.savings, locale)}
          </span>
        </div>
        <Bar value={run.savings} max={step.target} />
        <Label>
          {step.full
            ? t("month.cushionDone")
            : t("month.cushionNext", { amount: hkd(step.target, locale) })}{" "}
          {t("month.cushionRuleOf", { amount: hkd(cushionTarget(run), locale) })}
        </Label>
      </div>
    </section>
  );
}
