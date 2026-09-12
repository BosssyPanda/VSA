"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { MoneyRow } from "@/components/ui/MoneyRow";
import { Sheet } from "@/components/ui/Sheet";
import { LOAN_TERM_MONTHS, PLAYER_LOAN_KINDS, loanOffer, projectLoan } from "@/lib/debt";
import { hkd } from "@/lib/format";
import type { PlayerLoanKind, RunState } from "@/lib/types";

const AMOUNTS = [500, 1000, 2000, 5000];

/** Presets rather than a free field: fewer ways to mistype, and no numeric keyboard. */
function AmountPicker({
  amounts,
  value,
  onChange,
  locale,
}: {
  amounts: number[];
  value: number;
  onChange: (amount: number) => void;
  locale: "en" | "tl" | "id";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {amounts.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onChange(amount)}
          aria-pressed={amount === value}
          className={
            amount === value
              ? "min-h-12 rounded-[var(--radius-button)] border border-ink bg-ground px-4 py-3 text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium"
              : "min-h-12 rounded-[var(--radius-button)] border border-line-strong bg-card px-4 py-3 text-[length:var(--text-body)] leading-[var(--leading-body)] hover:bg-ground"
          }
        >
          {hkd(amount, locale)}
        </button>
      ))}
    </div>
  );
}

/**
 * What a loan costs, before anything is signed.
 *
 * One month and twelve months, both, from `projectLoan` — which simulates the same
 * arithmetic the run will charge, so the figure here cannot flatter the figure there.
 * A lender advertises the monthly payment; the total is the number that matters, and
 * putting them side by side is most of what this product has to teach about borrowing.
 *
 * The way out is drawn by `Sheet` itself, so this sheet cannot ship without one. Both
 * actions carry the same weight on purpose — see the comment above them for why.
 */
export function BorrowSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (kind: PlayerLoanKind, amount: number) => void;
}) {
  const { t, tn, locale } = useI18n();
  const [kind, setKind] = useState<PlayerLoanKind>("licensed-lender");
  const [amount, setAmount] = useState(AMOUNTS[1]);

  const offer = loanOffer(kind, amount);
  const projection = offer ? projectLoan(offer) : null;

  return (
    <Sheet open={open} onClose={onClose} title={t("borrow.title")} closeLabel={t("borrow.notNow")}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>{t("borrow.from")}</Label>
          <div className="flex flex-col gap-2">
            {PLAYER_LOAN_KINDS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                aria-pressed={option === kind}
                className={
                  option === kind
                    ? "min-h-12 rounded-[var(--radius-button)] border border-ink bg-ground px-4 py-3 text-left text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium"
                    : "min-h-12 rounded-[var(--radius-button)] border border-line-strong bg-card px-4 py-3 text-left text-[length:var(--text-body)] leading-[var(--leading-body)] hover:bg-ground"
                }
              >
                {t(`borrow.kind.${option}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("borrow.howMuch")}</Label>
          <AmountPicker amounts={AMOUNTS} value={amount} onChange={setAmount} locale={locale} />
        </div>

        {projection && projection.months > 0 ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius-button)] bg-ground p-3">
            <MoneyRow
              label={t("borrow.everyMonth")}
              value={tn("borrow.perMonth", LOAN_TERM_MONTHS, {
                amount: hkd(projection.monthly, locale),
              })}
            />
            <MoneyRow
              label={t("borrow.totalBack")}
              value={hkd(projection.total, locale)}
              note={t("borrow.extra", { amount: hkd(projection.interest, locale) })}
            />
          </div>
        ) : (
          <p className="m-0 rounded-[var(--radius-button)] bg-ground p-3 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("borrow.familyNote")}
          </p>
        )}

        {/* Two actions of equal weight. An earlier version made "Not now" the filled
            green button and the loan a quiet underlined link, which is the product
            leaning on the player's elbow — and a player who needs the money that month
            reads the nudge as being told off. The sheet's job is to show what the loan
            costs over one month and over twelve, plainly, and then get out of the way. */}
        <Button kind="secondary" onClick={() => onConfirm(kind, amount)}>
          {t("borrow.take", { amount: hkd(amount, locale) })}
        </Button>
      </div>
    </Sheet>
  );
}

/** Moving money into the cushion, which is the one habit the whole product is for. */
export function SetAsideSheet({
  open,
  onClose,
  run,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  run: RunState;
  onConfirm: (amount: number) => void;
}) {
  const { t, locale } = useI18n();
  const [amount, setAmount] = useState(AMOUNTS[0]);
  const affordable = AMOUNTS.filter((a) => a <= Math.max(0, run.cash));

  return (
    <Sheet open={open} onClose={onClose} title={t("aside.title")} closeLabel={t("sheet.close")}>
      <div className="flex flex-col gap-4">
        <MoneyRow label={t("aside.have")} value={hkd(run.cash, locale)} />

        {affordable.length > 0 ? (
          <>
            <div className="flex flex-col gap-2">
              <Label>{t("aside.howMuch")}</Label>
              <AmountPicker
                amounts={affordable}
                value={affordable.includes(amount) ? amount : affordable[0]}
                onChange={setAmount}
                locale={locale}
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <Button
                kind="primary"
                onClick={() => onConfirm(affordable.includes(amount) ? amount : affordable[0])}
              >
                {t("aside.confirm")}
              </Button>
              {run.savings > 0 ? (
                <Button kind="secondary" onClick={() => onConfirm(-run.savings)}>
                  {t("aside.takeBack", { amount: hkd(run.savings, locale) })}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("aside.nothingSpare")}
          </p>
        )}
      </div>
    </Sheet>
  );
}

/** Paying a debt down by hand, one line at a time. */
export function RepaySheet({
  open,
  onClose,
  run,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  run: RunState;
  onConfirm: (debtId: string, amount: number) => void;
}) {
  const { t, locale } = useI18n();
  const lines = run.debts.filter((d) => d.balance > 0);
  const [chosen, setChosen] = useState<string | null>(null);
  const line = lines.find((d) => d.id === chosen) ?? lines[0];
  const payable = line ? Math.min(line.balance, Math.max(0, run.cash)) : 0;
  const amounts = AMOUNTS.filter((a) => a <= payable);
  const [amount, setAmount] = useState(AMOUNTS[0]);

  return (
    <Sheet open={open} onClose={onClose} title={t("repay.title")} closeLabel={t("sheet.close")}>
      <div className="flex flex-col gap-4">
        {lines.length > 1 ? (
          <div className="flex flex-col gap-2">
            <Label>{t("repay.which")}</Label>
            {lines.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setChosen(d.id)}
                aria-pressed={d.id === line?.id}
                className={
                  d.id === line?.id
                    ? "min-h-12 rounded-[var(--radius-button)] border border-ink bg-ground px-4 py-3 text-left text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium"
                    : "min-h-12 rounded-[var(--radius-button)] border border-line-strong bg-card px-4 py-3 text-left text-[length:var(--text-body)] leading-[var(--leading-body)] hover:bg-ground"
                }
              >
                {d.label} · {hkd(d.balance, locale)}
              </button>
            ))}
          </div>
        ) : null}

        {line ? <MoneyRow label={line.label} value={hkd(line.balance, locale)} /> : null}

        {amounts.length > 0 && line ? (
          <>
            <div className="flex flex-col gap-2">
              <Label>{t("repay.howMuch")}</Label>
              <AmountPicker
                amounts={amounts}
                value={amounts.includes(amount) ? amount : amounts[0]}
                onChange={setAmount}
                locale={locale}
              />
            </div>
            <Button
              kind="primary"
              onClick={() => onConfirm(line.id, amounts.includes(amount) ? amount : amounts[0])}
            >
              {t("repay.confirm")}
            </Button>
          </>
        ) : (
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("repay.nothingSpare")}
          </p>
        )}
      </div>
    </Sheet>
  );
}
