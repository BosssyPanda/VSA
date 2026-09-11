import { SHARED_CARDS } from "@/content/cards/shared";
import { PERSONA_CARDS } from "@/content/cards/persona";
import type { Card, CardContext, Choice, ConceptId, PersonaId } from "./types";

/** Every card in the build, in a stable order. */
export const CARDS: Card[] = [...SHARED_CARDS, ...PERSONA_CARDS];

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCard(id: string): Card | undefined {
  return BY_ID.get(id);
}

export function isTrap(card: Card): boolean {
  return card.kind === "trap";
}

export function cardPersonas(card: Card): PersonaId[] | "all" {
  return card.personas;
}

/** The concepts a card can teach: the union of everything its outcomes carry. */
export function conceptsForCard(card: Card): ConceptId[] {
  const set = new Set<ConceptId>();
  for (const choice of card.choices) {
    for (const outcome of choice.outcomes) {
      for (const id of outcome.concepts) set.add(id);
    }
  }
  return [...set];
}

/**
 * Which cards could be drawn right now.
 *
 * Order is the order of `CARDS`, never the order of a Set or an object's keys: the
 * draw is seeded, and a seeded draw over an unstable list is not seeded at all.
 */
export function eligibleCards(ctx: CardContext, used: readonly string[]): Card[] {
  const spent = new Set(used);
  return CARDS.filter((card) => {
    if (card.once && spent.has(card.id)) return false;
    if (card.personas !== "all" && !card.personas.includes(ctx.persona)) return false;
    if (card.minMonth !== undefined && ctx.month < card.minMonth) return false;
    if (card.maxMonth !== undefined && ctx.month > card.maxMonth) return false;
    if (card.requires && !card.requires(ctx)) return false;
    return true;
  });
}

/**
 * The choices a player can actually take, with the rest shown as locked.
 *
 * Never returns an empty list. A card that offers nothing is a dead end, and a dead
 * end in a game about money reads as "you have no options", which is the one message
 * this product must never send by accident. If every choice is gated, the gates are
 * dropped and the choices are offered anyway — an engine property checks this.
 */
export function availableChoices(card: Card, ctx: CardContext): Choice[] {
  const open = card.choices.filter((choice) => !choice.requires || choice.requires(ctx));
  return open.length > 0 ? open : card.choices;
}

/** Whether a choice is offered but not takeable, and the plain reason why. */
export function lockedReason(choice: Choice, ctx: CardContext): string | null {
  if (!choice.requires || choice.requires(ctx)) return null;
  return choice.locked ?? null;
}
