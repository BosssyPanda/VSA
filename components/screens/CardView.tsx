"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/ChoiceRow";
import { Pitch } from "@/components/ui/Pitch";
import { availableChoices, lockedReason } from "@/lib/cards";
import { fillIn } from "@/lib/i18n";
import type { Card as CardType, CardContext } from "@/lib/types";

/**
 * One situation, and what you decide about it.
 *
 * **A trap card and a life card look the same until it is answered.** No red rule, no
 * warning header, no list of reasons this might be risky. The card names who the message
 * is from, quotes what it says, and asks. Everything explanatory — the tells, the red,
 * "why this could cost you money" — belongs to the outcome, because a player who learns
 * "the red one is the scam" has learned another colour, and the message on their own
 * phone will not draw one.
 *
 * The safety rail is not the styling, it is the exit. "Not sure? Leave it. It comes back
 * next month, and that costs nothing" sits above the choices, before the decision rather
 * than after it, on every card that allows it. No timers. Nothing that must be answered
 * now.
 *
 * Choices a player cannot take are listed as plain lines rather than dead controls. The
 * reason is the useful part — "You have nothing set aside yet" tells somebody something
 * about their own month; a greyed-out button tells them only *no*.
 */
export function CardView({
  card,
  context,
  playerName,
  onChoose,
}: {
  card: CardType;
  context: CardContext;
  /** The name the player is going by. Card content may greet them with it. */
  playerName: string;
  onChoose: (choiceId: string) => void;
}) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string | null>(null);
  const say = (text: string) => fillIn(text, { name: playerName });

  const open = availableChoices(card, context);
  const shut = card.choices
    .filter((c) => !open.some((o) => o.id === c.id))
    .map((c) => lockedReason(c, context))
    .filter((reason): reason is string => Boolean(reason))
    .map((reason) => fillIn(reason, { name: playerName }));

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
        {say(card.title)}
      </h2>

      {card.pitch ? (
        <Pitch
          from={t(`channel.${card.pitch.channel}`, { from: card.pitch.from })}
          lines={card.pitch.lines.map(say)}
        />
      ) : null}

      <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
        {say(card.prompt)}
      </p>

      {card.deferrable ? (
        <p className="m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
          {t("card.leaveIt")}
        </p>
      ) : null}

      <ChoiceGroup
        name={`card-${card.id}`}
        legend={t("card.decide")}
        options={open.map((choice) => ({
          id: choice.id,
          label: say(choice.label),
          blurb: say(choice.blurb),
        }))}
        value={picked}
        onSelect={setPicked}
        unavailable={shut}
      />

      {picked ? (
        <Button kind="primary" onClick={() => onChoose(picked)}>
          {t("card.continue")}
        </Button>
      ) : null}
    </Card>
  );
}
