"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { cx } from "@/lib/cx";
import { fixedTotal } from "@/lib/costs";
import { hkd } from "@/lib/format";
import { expectedIncome, initRun } from "@/lib/monthEngine";
import { PERSONA_IDS, needsCommunityReview } from "@/lib/personas";
import type { PersonaId } from "@/lib/types";

/**
 * Three lives, one city.
 *
 * Each tile says the same six things in the same order, so the choice is between
 * situations rather than between how well each one is written. Money in and money out
 * are on the tile because they are the actual difference between these lives, and
 * because reading "HK$ 5,100 in, HK$ 3,600 out" before you start is the first lesson.
 *
 * They are selectable tiles, not buttons that start the game: picking is reversible,
 * starting is not, and a tap that silently commits twelve months is a tap somebody will
 * regret. Start appears once a life is chosen — never as a dead grey control waiting to
 * be earned.
 *
 * Every tile carries "not yet reviewed by the community". All three, honestly, until
 * somebody from each community has read their own cards. A label on only one life would
 * read as a ranking of whose story we trust.
 */
export function PickLife({
  onBegin,
  invitedPersona,
}: {
  onBegin: (personaId: PersonaId, name: string) => void;
  invitedPersona?: PersonaId | null;
}) {
  const { t, locale } = useI18n();
  const [chosen, setChosen] = useState<PersonaId | null>(invitedPersona ?? null);
  const [name, setName] = useState("");

  const lives = useMemo(
    () =>
      PERSONA_IDS.map((id) => {
        // Built through the real engine rather than read off the persona, so the
        // figures on this screen are the figures the first month will actually use.
        const sample = initRun(id, "", 0);
        return {
          id,
          monthlyIn: expectedIncome(sample),
          monthlyOut: fixedTotal(sample),
        };
      }),
    [],
  );

  return (
    <main className="py-6 pb-28 md:pb-10">
      <Column className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <h1
            id="pick-a-life"
            className="m-0 text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold"
          >
            {t("pick.title")}
          </h1>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted">
            {t("pick.sub")}
          </p>
        </header>

        {/* Labelled by the heading that is already on the screen rather than by a hidden
            legend: nothing in this product is text that only some people can read, and a
            visually-hidden string is a string nobody proofreads or translates. */}
        <fieldset aria-labelledby="pick-a-life" className="m-0 flex flex-col gap-3 border-0 p-0">
          {lives.map(({ id, monthlyIn, monthlyOut }) => {
            const selected = id === chosen;
            return (
              <label
                key={id}
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-4",
                  "transition-colors duration-150",
                  selected ? "border-ink bg-ground" : "border-line-strong bg-card hover:bg-ground",
                )}
              >
                <input
                  type="radio"
                  name="life"
                  value={id}
                  checked={selected}
                  onChange={() => setChosen(id)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-ink)]"
                />
                <span className="flex flex-1 flex-col">
                  <span className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
                    {t(`persona.${id}.name`)}
                  </span>
                  <Label>{t(`persona.${id}.who`)}</Label>
                  <span className="mt-2 text-[length:var(--text-body)] leading-[var(--leading-body)]">
                    {t(`persona.${id}.blurb`)}
                  </span>
                  <span className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <Label>{t("pick.moneyIn")}</Label>
                    <Label>{t("pick.moneyOut")}</Label>
                    <span className="text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium">
                      {hkd(monthlyIn, locale)}
                    </span>
                    <span className="text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium">
                      {hkd(monthlyOut, locale)}
                    </span>
                  </span>
                  {needsCommunityReview(id) ? (
                    <span className="mt-3 border-t border-line pt-3">
                      <Label>{t("pick.unreviewed")}</Label>
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="player-name"
            className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted"
          >
            {t("pick.nameLabel")}
          </label>
          <input
            id="player-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            autoComplete="off"
            className="min-h-12 w-full rounded-[var(--radius-button)] border border-line-strong bg-card px-4 py-3 text-[length:var(--text-body)] leading-[var(--leading-body)]"
          />
          <Label>{t("pick.nameHint")}</Label>
        </div>

        {chosen ? (
          <Button kind="primary" onClick={() => onBegin(chosen, name)}>
            {t("pick.begin")}
          </Button>
        ) : null}
      </Column>
    </main>
  );
}
