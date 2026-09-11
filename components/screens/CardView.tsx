"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pitch, WarningCard } from "@/components/ui/WarningCard";
import { availableChoices, lockedReason } from "@/lib/cards";
import type { Card as CardType, CardContext, Choice } from "@/lib/types";

/**
 * One situation, and what can be done about it.
 *
 * A life card is a white card with a question. A trap card is the same content inside a
 * warning frame, with the message quoted as it arrived and the reasons it may cost money
 * set out in one to three plain lines — after the pitch, never inside it.
 *
 * The choice order is load-bearing and enforced by a property: safe options first as
 * buttons, the risky one last as quiet text. It is never hidden. A game that hid the
 * option a real lender is pushing would teach nothing about refusing it, and a player
 * who has taken that option in real life would find the omission dishonest.
 */
export function CardView({
  card,
  context,
  onChoose,
}: {
  card: CardType;
  context: CardContext;
  onChoose: (choiceId: string) => void;
}) {
  const { t } = useI18n();
  const open = availableChoices(card, context);
  const isTrap = card.kind === "trap";

  const body = (
    <>
      {isTrap && card.pitch ? (
        <Pitch from={t("card.message")} lines={card.pitch.lines} />
      ) : null}

      <p className="m-0 text-[length:var(--text-body)] leading-[var(--leading-body)]">
        {card.prompt}
      </p>

      {card.why && card.why.length > 0 ? (
        <div>
          <h3 className="m-0 mb-1.5 text-[length:var(--text-label)] leading-[var(--leading-label)] font-medium text-muted">
            {t("card.why")}
          </h3>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {card.why.map((point, i) => (
              <li
                key={i}
                className="text-[length:var(--text-body)] leading-[var(--leading-body)] before:mr-2 before:content-['·']"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {card.choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            context={context}
            available={open.some((c) => c.id === choice.id)}
            onChoose={onChoose}
          />
        ))}
      </div>

      {card.deferrable ? (
        <p className="m-0 border-t border-line pt-3 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
          {t("card.leaveIt")}
        </p>
      ) : null}
    </>
  );

  if (isTrap && card.pitch) {
    return (
      <WarningCard header={t(`channel.${card.pitch.channel}`, { from: card.pitch.from })}>
        <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
          {card.title}
        </h2>
        {body}
      </WarningCard>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="m-0 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
        {card.title}
      </h2>
      {body}
    </Card>
  );
}

/**
 * A choice, including the ones that cannot be taken.
 *
 * A locked option stays on screen with its reason in plain words rather than
 * disappearing. Options vanishing without explanation is how an interface teaches
 * somebody that they do not understand their own situation.
 */
function ChoiceButton({
  choice,
  context,
  available,
  onChoose,
}: {
  choice: Choice;
  context: CardContext;
  available: boolean;
  onChoose: (choiceId: string) => void;
}) {
  const reason = available ? null : lockedReason(choice, context);

  return (
    <div className="flex flex-col gap-1">
      <Button kind={choice.kind} disabled={!available} onClick={() => onChoose(choice.id)}>
        {choice.label}
      </Button>
      <span className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
        {reason ?? choice.blurb}
      </span>
    </div>
  );
}
