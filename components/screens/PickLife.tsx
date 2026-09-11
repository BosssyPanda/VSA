"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { fixedTotal } from "@/lib/costs";
import { hkd } from "@/lib/format";
import { expectedIncome, initRun } from "@/lib/monthEngine";
import { PERSONA_IDS, getPersona, needsCommunityReview } from "@/lib/personas";
import type { PersonaId } from "@/lib/types";

/**
 * Three lives, one city.
 *
 * Each tile says the same six things in the same order, so the choice is between
 * situations rather than between how well each one is written. Money in and money out
 * are on the tile because they are the actual difference between these lives, and
 * because seeing "HK$ 5,100 in, HK$ 3,600 out" before you start is the first lesson.
 *
 * Every tile carries "not yet reviewed by the community". All three, honestly, until
 * somebody from each community has read their own cards. A label that appeared on only
 * one life would read as a ranking of whose story we trust.
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
        const persona = getPersona(id);
        // Built through the real engine rather than read off the persona, so the
        // figures on this screen are the figures the first month will actually use.
        const sample = initRun(id, "", 0);
        return {
          persona,
          monthlyIn: expectedIncome(sample),
          monthlyOut: fixedTotal(sample),
        };
      }),
    [],
  );

  return (
    <main className="py-8 pb-28 md:pb-8">
      <Column className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
            {t("pick.title")}
          </h1>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted">
            {t("pick.sub")}
          </p>
        </header>

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {lives.map(({ persona, monthlyIn, monthlyOut }) => {
            const selected = persona.id === chosen;
            return (
              <li key={persona.id}>
                <button
                  type="button"
                  onClick={() => setChosen(persona.id)}
                  aria-pressed={selected}
                  className="w-full text-left"
                >
                  <Card
                    as="div"
                    className={
                      selected
                        ? "border-accent bg-accent-tint"
                        : "transition-colors duration-150 hover:border-accent"
                    }
                  >
                    <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
                      {t(`persona.${persona.id}.name`)}
                    </h2>
                    <Label className="mt-0.5">
                      {t(`persona.${persona.id}.who`)}
                    </Label>
                    <p className="mt-2 mb-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
                      {t(`persona.${persona.id}.blurb`)}
                    </p>
                    <dl className="mt-3 mb-0 grid grid-cols-2 gap-3">
                      <div className="m-0">
                        <dt className="m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
                          {t("pick.moneyIn")}
                        </dt>
                        <dd className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium">
                          {hkd(monthlyIn, locale)}
                        </dd>
                      </div>
                      <div className="m-0">
                        <dt className="m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
                          {t("pick.moneyOut")}
                        </dt>
                        <dd className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium">
                          {hkd(monthlyOut, locale)}
                        </dd>
                      </div>
                    </dl>
                    {needsCommunityReview(persona.id) ? (
                      <p className="mt-3 mb-0 border-t border-line pt-3 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
                        {t("pick.unreviewed")}
                      </p>
                    ) : null}
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>

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
            className="min-h-12 w-full rounded-[var(--radius-button)] border border-line bg-card px-4 py-3 text-[length:var(--text-body)] leading-[var(--leading-body)]"
          />
          <Label>{t("pick.nameHint")}</Label>
        </div>

        <Button kind="primary" disabled={!chosen} onClick={() => chosen && onBegin(chosen, name)}>
          {t("pick.begin")}
        </Button>
      </Column>
    </main>
  );
}
