import type { Concept, ConceptId } from "./types";

/**
 * What this game is trying to leave behind.
 *
 * Eight concepts, each with a `rule` that fits in one breath. That is the whole
 * teaching model, and it is a deliberate rejection of the alternative: research on
 * financial education for people with little formal schooling (Drexler, Fischer and
 * Schoar, 2014) found that rules of thumb beat principles-based training, which is
 * what most curricula and most games actually deliver.
 *
 * A run ends by handing back three of these rules. Somebody should be able to repeat
 * one to a friend a week later without having played again.
 */
export const CONCEPTS: Record<ConceptId, Concept> = {
  "borrowing-cost": {
    id: "borrowing-cost",
    category: "borrow",
    title: "What borrowing costs",
    def: "The real price of a loan is what you pay back in total, not the size of the monthly payment.",
    rule: "Before you borrow, ask what one month costs. Then ask what twelve months cost.",
    keywords: ["loan", "interest", "lender", "borrow", "apr", "instalment"],
  },
  "scam-recognition": {
    id: "scam-recognition",
    category: "protect",
    title: "Spotting a scam",
    def: "Scams look ordinary. They are recognised by their signs, not by how they feel.",
    rule: "Urgency is the tell. Nothing safe expires today.",
    keywords: ["scam", "fraud", "deception", "message", "link", "verify"],
  },
  cushion: {
    id: "cushion",
    category: "save",
    title: "Your cushion",
    def: "Money set aside so that a bad month does not turn into a loan.",
    rule: "Aim for one month of pay set aside. Start with one week.",
    keywords: ["savings", "emergency", "set aside", "cushion", "buffer"],
  },
  "rent-rights": {
    id: "rent-rights",
    category: "home",
    title: "Your rights as a tenant",
    def: "A subdivided-flat tenancy has legal limits on the deposit, the rent rise and how long you may stay.",
    rule: "Get the tenancy in writing. The rent may rise at most 10% at renewal.",
    keywords: ["rent", "landlord", "tenancy", "deposit", "renewal", "water", "electricity"],
  },
  "family-money": {
    id: "family-money",
    category: "family",
    title: "Money and family",
    def: "Money moving between people carries obligation, and obligation has a cost even when interest does not.",
    rule: "Say the amount and the date out loud. Silence is what breaks families, not money.",
    keywords: ["family", "remit", "send home", "lend", "guarantor", "referee"],
  },
  "payments-cards": {
    id: "payments-cards",
    category: "borrow",
    title: "Cards and instalments",
    def: "Minimum payments, buy-now-pay-later and contracts are all borrowing, whatever they are called.",
    rule: "A minimum payment is a rental fee on your own debt.",
    keywords: ["card", "minimum", "instalment", "bnpl", "contract", "octopus", "autopay"],
  },
  "mpf-basics": {
    id: "mpf-basics",
    category: "save",
    title: "Your MPF",
    def: "A retirement account your employer must pay into as well. It is yours, and you can check it.",
    rule: "Your employer's 5% is your money. Check the statement once a year.",
    keywords: ["mpf", "retirement", "provident", "contribution", "statement"],
  },
  "where-to-help": {
    id: "where-to-help",
    category: "protect",
    title: "Where to get help",
    def: "Free, confidential help exists for debt, wages, scams and housing, and using it is not an admission of failure.",
    rule: "Ask early. The free helpline costs nothing and the loan costs everything.",
    keywords: ["help", "hotline", "caritas", "labour", "enrich", "scameter", "18222"],
  },
};

export const CONCEPT_IDS = Object.keys(CONCEPTS) as ConceptId[];

export function concept(id: ConceptId): Concept {
  return CONCEPTS[id];
}

/**
 * Guess concepts from words. Development only.
 *
 * LifePatch tagged every lesson this way and paid for it: rewriting a line of copy
 * silently changed what the game believed it had taught, with no test failure. Here
 * every outcome carries explicit concepts and `content-lint` rejects any that does
 * not. This function exists so a half-written card still behaves while it is being
 * drafted, and for nothing else.
 */
export function conceptsForText(text: string): ConceptId[] {
  if (process.env.NODE_ENV === "production") return [];
  const haystack = text.toLowerCase();
  return CONCEPT_IDS.filter((id) => CONCEPTS[id].keywords.some((k) => haystack.includes(k)));
}
