"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { MoneyRow } from "@/components/ui/MoneyRow";
import { hkd } from "@/lib/format";
import { VERDICTS } from "@/lib/stability";
import type { MonthRecord } from "@/lib/types";

/**
 * The month, closed.
 *
 * A receipt rather than a scoreboard: what came in, what went out, what is left. The
 * tier word appears with its glyph because a screenshot of this gets read in greyscale
 * on somebody else's phone, and because two of the five tiers are ones nobody should
 * have to read a colour to understand.
 *
 * "Taken from your cushion" is on here whenever it happened. That line is the entire
 * argument for saving, made once a month with the player's own numbers.
 */
export function Receipt({ record, onContinue }: { record: MonthRecord; onContinue: () => void }) {
  const { t, locale } = useI18n();
  const verdict = VERDICTS[record.tier];

  return (
    <main className="py-6 pb-28 md:pt-20 md:pb-10">
      <Column className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <Label>{t("receipt.title", { month: record.m })}</Label>
          <p
            className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium"
            style={{ color: verdict.hex }}
          >
            <span aria-hidden="true" className="mr-2">
              {verdict.glyph}
            </span>
            {t(`tier.${verdict.tier}.title`)}
          </p>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted">
            {t(`tier.${verdict.tier}.blurb`)}
          </p>
        </header>

        <Card className="flex flex-col">
          <MoneyRow label={t("receipt.in")} value={hkd(record.income, locale)} glyph="▲" />
          <MoneyRow label={t("receipt.out")} value={hkd(record.fixed, locale)} glyph="▼" />
          {record.debtPaid > 0 ? (
            <MoneyRow
              label={t("receipt.debtPaid")}
              value={hkd(record.debtPaid, locale)}
              note={
                record.interest > 0
                  ? t("receipt.ofWhichInterest", { amount: hkd(record.interest, locale) })
                  : undefined
              }
              glyph="▼"
            />
          ) : null}
          {record.fromCushion > 0 ? (
            <MoneyRow
              label={t("receipt.fromCushion")}
              value={hkd(record.fromCushion, locale)}
              note={t("receipt.cushionDidItsJob")}
            />
          ) : null}
        </Card>

        <Card className="flex flex-col">
          <MoneyRow label={t("receipt.leftInHand")} value={hkd(record.cashEnd, locale)} />
          <MoneyRow label={t("receipt.setAside")} value={hkd(record.savingsEnd, locale)} />
          <MoneyRow
            label={t("receipt.stillOwed")}
            value={hkd(record.debtEnd, locale)}
            atRisk={record.debtEnd > 0 && !record.familyCovered}
          />
        </Card>

        {!record.familyCovered ? (
          <Card>
            <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
              {t("receipt.familyShort")}
            </p>
          </Card>
        ) : null}

        <Button kind="primary" onClick={onContinue}>
          {t("receipt.next")}
        </Button>
      </Column>
    </main>
  );
}
