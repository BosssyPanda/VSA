"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card, Label } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { Sources } from "@/components/screens/Sources";
import { NavLink, OutLink } from "@/components/ui/Link";
import {
  HELP_TOPICS,
  INTERPRETATION_LINES,
  helpLine,
  helpLinesForTopic,
} from "@/lib/helpLines";
import { siteName } from "@/lib/format";
import type { HelpLine, HelpTopic, PersonaId } from "@/lib/types";

/** The one number for something that is happening right now. */
const EMERGENCY = "anti-scam" as const;

/**
 * Help, entered by problem rather than by organisation.
 *
 * The first screen asks one question — "What do you need help with?" — and offers five
 * answers in the words a person would use: a message I do not trust, money I owe, a
 * problem at work, my flat or my rent, being treated unfairly. Nobody arrives knowing
 * that the body which enforces the rent cap is the Rating and Valuation Department, and
 * nobody should have to. The taxonomy is the person's problem, not the government's org
 * chart.
 *
 * What used to be here was twelve organisations in a row, which is a filing cabinet
 * handed to somebody who is frightened. Every topic now holds at least two services for
 * every life, and the engine fails the build if one does not (`P21e`).
 *
 * The figures ledger has moved to its own Sources page. It is a promise this product
 * keeps to anybody who wants to check it, and it belongs next to the credits rather than
 * between a frightened person and a phone number.
 */
export function Help({
  onBack,
  backLabel,
  personaId,
}: {
  onBack?: () => void;
  backLabel?: string;
  personaId?: PersonaId | null;
}) {
  const { t } = useI18n();
  const [view, setView] = useState<HelpTopic | "topics" | "sources">("topics");

  if (view === "sources") {
    return <Sources onBack={() => setView("topics")} backLabel={t("help.backToHelp")} />;
  }

  if (view !== "topics") {
    const topic = HELP_TOPICS.find((x) => x.id === view);
    const lines = helpLinesForTopic(view, personaId ?? undefined);
    return (
      <main className="py-6 pb-28 md:pb-10">
        <Column className="flex flex-col gap-5">
          <NavLink onClick={() => setView("topics")}>{t("help.allTopics")}</NavLink>
          <header className="flex flex-col gap-2">
            <h1 className="m-0 text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold">
              {t(`helpTopic.${view}.label`)}
            </h1>
            <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)] text-muted">
              {topic ? t(`helpTopic.${view}.blurb`) : null}
            </p>
          </header>
          {lines.map((line) => (
            <HelpLineCard key={line.id} line={line} />
          ))}
        </Column>
      </main>
    );
  }

  return (
    <main className="py-6 pb-28 md:pb-10">
      <Column className="flex flex-col gap-6">
        {/* Something happening right now outranks any taxonomy. One tap from Help, and
            Help is one tap from every screen in the product. */}
        <section className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-line bg-card p-4">
          <Label>{t("help.now")}</Label>
          <Number line={helpLine(EMERGENCY)} />
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t(`helpLine.${EMERGENCY}.what`)}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h1 className="m-0 text-[length:var(--text-display)] leading-[var(--leading-display)] font-semibold">
            {t("help.question")}
          </h1>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {HELP_TOPICS.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => setView(topic.id)}
                  className="flex min-h-12 w-full flex-col gap-0.5 rounded-[var(--radius-button)] border border-line-strong bg-card p-4 text-left hover:bg-ground"
                >
                  <span className="text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium">
                    {t(`helpTopic.${topic.id}.label`)}
                  </span>
                  <span className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
                    {t(`helpTopic.${topic.id}.blurb`)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* The most useful number in the file for the people this is built for, and the
            one almost nobody knows exists. */}
        <section className="flex flex-col gap-2 border-t border-line pt-5">
          <h2 className="m-0 text-[length:var(--text-section)] leading-[var(--leading-section)] font-semibold">
            {t("help.interpreters")}
          </h2>
          <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
            {t("help.interpretersWhat")}
          </p>
          <ul className="m-0 flex list-none flex-col p-0">
            {INTERPRETATION_LINES.map((line) => (
              <li
                key={line.phone}
                className="flex flex-wrap items-center justify-between gap-x-3 border-b border-line last:border-b-0"
              >
                <span className="text-[length:var(--text-body)] leading-[var(--leading-body)]">
                  {line.endonym}
                </span>
                {/* A full tap target, not a 24px line of text. Somebody dialling this is
                    doing it because a government office does not speak their language,
                    often while upset, often one-handed on a bus. */}
                <OutLink href={`tel:${line.phone.replace(/\s/g, "")}`} role="call">
                  {line.phone}
                </OutLink>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-2.5 border-t border-line pt-5">
          <Button kind="secondary" onClick={() => setView("sources")}>
            {t("help.figures")}
          </Button>
          {onBack && backLabel ? (
            <Button kind="secondary" onClick={onBack}>
              {backLabel}
            </Button>
          ) : null}
        </div>
      </Column>
    </main>
  );
}

/**
 * One place to go, with the number tappable.
 *
 * `tel:` because the person reading this is on a phone and may be frightened, and the
 * distance between reading a number and dialling it should be one tap. The caveat line
 * is shown whenever the source page carries one — "this line is for advice, not for
 * reporting a crime" is exactly the kind of thing somebody needs before they call.
 */
export function HelpLineCard({ line }: { line: HelpLine }) {
  const { t } = useI18n();
  return (
    <Card className="flex flex-col gap-1.5">
      <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
        {t(`helpLine.${line.id}.org`)}
      </h2>
      <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
        {t(`helpLine.${line.id}.what`)}
      </p>
      <Number line={line} />
      {line.hours ? <Label>{t(`helpLine.${line.id}.hours`)}</Label> : null}
      {line.note ? <Label>{t(`helpLine.${line.id}.note`)}</Label> : null}
      {line.url ? (
        <OutLink href={line.url}>{siteName(line.url)}</OutLink>
      ) : null}
    </Card>
  );
}

/**
 * The same place to go, said in three lines instead of seven.
 *
 * For the final statement, where the point is to leave somebody with two or three
 * numbers they might actually call — not with the opening hours, the caveat and the web
 * address of each one. Those are on the Help screen, which is one tap away and is where
 * a person goes when they have decided to call.
 */
export function HelpLineBrief({ line }: { line: HelpLine }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-0.5 border-b border-line pb-4 last:border-b-0 last:pb-0">
      <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
        {t(`helpLine.${line.id}.org`)}
      </h2>
      <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
        {t(`helpLine.${line.id}.what`)}
      </p>
      <Number line={line} />
    </div>
  );
}

function Number({ line }: { line: HelpLine }) {
  if (!line.phone) return null;
  return (
    <OutLink href={`tel:${line.phone.replace(/\s/g, "")}`} role="callLarge">
      {line.phone}
    </OutLink>
  );
}
