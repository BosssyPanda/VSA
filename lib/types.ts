/**
 * Every shape the Month End engine touches, in one leaf module.
 *
 * One file, for two reasons. The QA harness compiles the engine headlessly
 * (`scripts/qa/build-engine.mjs`) and a type graph that reaches into React would
 * break that. And the content files, the engine modules and the screens all have to
 * agree about what a card is — three declarations of one contract is two too many.
 *
 * Nothing here imports anything. Nothing here has a runtime value except the string
 * unions, which are the closed sets the content lint checks against.
 */

// ── Language ────────────────────────────────────────────────────────────────
/**
 * The locales this build ships. English is the source language and the fallback;
 * Tagalog and Bahasa Indonesia are here from the first commit rather than retrofitted,
 * because the layout rules that make translation survivable (labels above values, no
 * truncation, buttons that wrap) are cheap now and expensive later.
 */
export type Locale = "en" | "tl" | "id";

/** A player-facing string. `voice` reserves a slot for recorded narration; unused in v1. */
export type StringRecord = { text: string; voice?: string };

// ── People ──────────────────────────────────────────────────────────────────
export type PersonaId = "sa-youth" | "mdw" | "sdu-family";

// ── What the game teaches ───────────────────────────────────────────────────
/**
 * The concept taxonomy. Deliberately eight, not thirty: the report ends with three
 * rules a person can repeat out loud, and you cannot draw three memorable rules out
 * of a taxonomy nobody can hold in their head.
 */
export type ConceptId =
  | "borrowing-cost"
  | "scam-recognition"
  | "cushion"
  | "rent-rights"
  | "family-money"
  | "payments-cards"
  | "mpf-basics"
  | "where-to-help";

export type ConceptCategory = "borrow" | "protect" | "save" | "home" | "family";

export type Concept = {
  id: ConceptId;
  category: ConceptCategory;
  /** Short name, as it appears on the report. */
  title: string;
  /** One plain sentence: what this is. */
  def: string;
  /** The rule of thumb. This is the thing a player should still know next month. */
  rule: string;
  /** Dev-only fallback for untagged outcomes; `content-lint --strict` rejects reliance on it. */
  keywords: string[];
};

/**
 * The signs that give a pitch away.
 *
 * These are the transferable part of the whole product. A player will not meet the
 * same scam twice, but they will meet the same tells, so scam cards reuse ids on
 * purpose: recognising "asks for a one-time password" in month 3 should make month 9
 * easier even when the story is different.
 */
export type TellId =
  | "urgency"
  | "no-credit-check"
  | "upfront-fee"
  | "unknown-sender"
  | "too-good"
  | "asks-otp-or-pin"
  | "pay-to-get-job"
  | "guaranteed-return"
  | "link-to-click"
  | "keep-it-secret"
  | "asks-employer-details"
  | "asks-id-photo";

// ── The facts ledger ────────────────────────────────────────────────────────
export type FactId =
  | "min-wage-hourly"
  | "mdw-min-wage"
  | "mdw-food-allowance"
  | "agency-fee-cap-pct"
  | "mpf-rate"
  | "mpf-exempt-floor"
  | "mpf-income-cap"
  | "mpf-contribution-cap"
  | "lender-apr-cap"
  | "lender-extortionate-apr"
  | "sdu-deposit-max-months"
  | "sdu-rent-rise-cap-pct"
  | "prh-wait-years"
  | "sdu-count"
  | "deception-share-of-crime"
  | "cpi-yoy";

export type FactUnit = "HKD" | "HKD/hr" | "HKD/month" | "pct" | "years" | "months" | "people";

/**
 * One real, dated, sourced number.
 *
 * Every figure the player sees traces back to one of these, and the screen that
 * shows it also shows when it was true. The alternative — plausible-looking numbers
 * — would make the game unfalsifiable, and this audience has been lied to with
 * confident numbers before.
 */
export type Fact = {
  id: FactId;
  label: string;
  value: number;
  unit: FactUnit;
  /** ISO date the figure took effect or was published. */
  asOf: string;
  source: { name: string; url: string };
  /** One plain sentence for the Figures list. */
  note?: string;
};

// ── Money ───────────────────────────────────────────────────────────────────
export type IncomeModel =
  | { kind: "hourly"; rateFact: "min-wage-hourly"; hoursBase: number; hoursJitter: number }
  | { kind: "salary"; monthly: number; mpf: boolean }
  | { kind: "mdw"; wageFact: "mdw-min-wage"; foodFact: "mdw-food-allowance"; remittance: number };

export type FixedCosts = {
  housing: number;
  food: number;
  transport: number;
  /** Money owed to people, not to companies: board at home, or money sent home. */
  family: number;
  other: number;
};

export type FixedField = keyof FixedCosts;

export type Tenancy =
  | {
      kind: "sdu-rent";
      termMonths: number;
      depositMonths: number;
      /** Legal ceiling on a renewal rise. The engine clamps to this; cards may ask for more. */
      riseCapPct: number;
      nextReviewMonth: number;
      pendingRisePct: number;
    }
  | { kind: "board" }
  | { kind: "live-in" };

export type DebtKind =
  | "licensed-lender"
  | "unlicensed-lender"
  | "credit-card"
  | "family"
  | "agency"
  | "bnpl";

/**
 * The two loans a player may choose to take for themselves. A closed subset of
 * `DebtKind`, declared here rather than in `lib/debt.ts` because the screens, the
 * journal and the replay all have to agree on it.
 */
export type PlayerLoanKind = Extract<DebtKind, "licensed-lender" | "family">;

export type DebtSeed = {
  kind: DebtKind;
  label: string;
  balance: number;
  /** Yearly rate as a fraction: 0.48 is the legal ceiling for a licensed lender. */
  apr: number;
  /** Fixed monthly payment (lender, agency, buy-now-pay-later). */
  instalment?: number;
  /** Credit-card minimum, as a fraction of the balance. */
  minPct?: number;
  /** A friend or employer was named to get this loan. They can be chased for it. */
  referee?: boolean;
  /** Family loans cost nothing in interest and something in everything else. */
  strainPerMonthLate?: number;
};

export type DebtLine = DebtSeed & {
  id: string;
  openedMonth: number;
  /** Months of missed payment, not an amount. */
  arrears: number;
  paidTotal: number;
  interestTotal: number;
};

// ── Cards ───────────────────────────────────────────────────────────────────
export type Tone = "good" | "bad" | "warning" | "neutral";
export type CardKind = "trap" | "life" | "reward";
export type Channel = "sms" | "whatsapp" | "call" | "poster" | "in-person";

/**
 * The trap, in its own words.
 *
 * These lines are written to look like the real thing, because recognising the real
 * thing is the skill. They never explain themselves and never wink at the player:
 * the explaining happens in `Card.why` and in the outcome, after a decision.
 */
export type TrapPitch = {
  channel: Channel;
  from: string;
  lines: string[];
  tells: TellId[];
};

export type MoneyEffect = {
  cash?: number;
  savings?: number;
  addDebt?: DebtSeed;
  payDebt?: { kind: DebtKind; amount: number };
  /** A change to monthly income for a number of months. */
  income?: { monthly: number; months: number };
  /** A change to one fixed cost. Permanent when `months` is omitted. */
  fixed?: { field: FixedField; monthly: number; months?: number };
  /** Social cost, 0..1, of leaning on people. */
  strain?: number;
  familyCovered?: boolean;
  /** A rent rise the landlord is asking for. The engine clamps it to the legal cap. */
  rentRisePct?: number;
};

export type Outcome = {
  weight: number;
  tone: Tone;
  effect: MoneyEffect;
  /** What happened, in the guide's voice. Past tense, never "you should have". */
  consequence: string;
  lesson?: string;
  /** Explicit and required. Keyword matching is not allowed to decide what a card taught. */
  concepts: ConceptId[];
  /** True when the player applied the concept, false when the trap won. Drives weak spots. */
  applied: boolean;
  /** Revealed after a trap resolves, never before. */
  tells?: TellId[];
  setFlags?: string[];
  clearFlags?: string[];
};

/**
 * `primary` and `secondary` are the safe paths and always come first; `quiet` marks the
 * risky one. The ordering is a design rule with a lint behind it, not a style preference.
 *
 * `quiet` is a fact about the deck, not an instruction to the renderer. It used to mean
 * "draw this as plain text rather than a button", which taught the player that the small
 * grey thing is the dangerous thing — a tell that does not survive contact with a real
 * lender's SMS, where the dangerous thing looks like everything else. `ButtonKind` has
 * no `quiet` and `ChoiceRow` draws every option identically; the word stays here so the
 * content can say which path is risky, and so the ordering lint has something to read.
 */
export type ChoiceKind = "primary" | "secondary" | "quiet";

export type Choice = {
  id: string;
  label: string;
  blurb: string;
  kind: ChoiceKind;
  outcomes: Outcome[];
  requires?: (c: CardContext) => boolean;
  /** Why this is unavailable, in plain words. Shown, not hidden. */
  locked?: string;
};

export type ReviewStatus = "draft" | "in-review" | "changes-requested" | "approved";

/** Who from the community read this card, and what they said. */
export type ReviewMeta = {
  persona: PersonaId | "shared";
  reviewer: string | null;
  org: string | null;
  /** ISO date. */
  date: string | null;
  status: ReviewStatus;
  notes?: string;
};

export type CardContext = {
  persona: PersonaId;
  month: number;
  months: number;
  cash: number;
  savings: number;
  cushionMonths: number;
  debtTotal: number;
  strain: number;
  familyCovered: boolean;
  flags: ReadonlySet<string>;
  hasDebt: (kind: DebtKind) => boolean;
};

export type Card = {
  id: string;
  kind: CardKind;
  title: string;
  /** The guide's framing line. May contain `[[term]]` glossary markup. */
  prompt: string;
  /** Required on trap cards. */
  pitch?: TrapPitch;
  /** One to three plain reasons this could cost money. Required on trap cards. */
  why?: string[];
  personas: PersonaId[] | "all";
  /** The union of every outcome's concepts. Lint enforces the equality. */
  concepts: ConceptId[];
  facts?: FactId[];
  minMonth?: number;
  maxMonth?: number;
  once?: boolean;
  weight?: number;
  /**
   * True on every trap card. A deferrable card left unanswered comes back next month
   * once, at no cost. Nobody in this game is ever forced to decide about money today.
   */
  deferrable?: boolean;
  requires?: (c: CardContext) => boolean;
  choices: Choice[];
  review: ReviewMeta;
};

// ── A person's starting position ────────────────────────────────────────────
export type Persona = {
  id: PersonaId;
  /** Their name, as they would introduce themselves. */
  name: string;
  age: number;
  district: string;
  job: string;
  /** One plain sentence about the month they are living. */
  blurb: string;
  /** The older-cousin voice for this life. */
  guideName: string;
  start: {
    cash: number;
    savings: number;
    debts: DebtSeed[];
    income: IncomeModel;
    fixed: FixedCosts;
    tenancy: Tenancy;
    dependants: number;
    flags: string[];
  };
  helpLines: HelpLineId[];
  /**
   * The community organisation whose reviewers sign off this persona's cards.
   * `null` means nobody has reviewed this life yet, and the game says so on screen.
   */
  partnerOrg: string | null;
};

// ── Where a run ends up ─────────────────────────────────────────────────────
export type StabilityTier = "cushioned" | "steady" | "tight" | "behind" | "trapped";

export type Verdict = {
  tier: StabilityTier;
  title: string;
  blurb: string;
  /**
   * What the tier means, not what colour to paint it.
   *
   * This was a raw `hex` lifted off PALETTE and injected as an inline style, which put
   * a literal colour in the DOM that `app/globals.css` had never authorised and that
   * the palette gate could not see — it greps for the token name, and a hex arriving
   * through a data object carries no token name. It also painted the two good tiers
   * accent green, and accent means "the safe thing to do next", never "you did well".
   */
  tone: "neutral" | "atRisk";
  /** Colour is never the only channel. */
  glyph: string;
};

// ── A run ───────────────────────────────────────────────────────────────────
export type EndReason = "complete" | "quit" | "trapped";

export type JournalAct =
  | ["c", string, string, number] // card id, choice id, outcome index
  | ["b", DebtKind, number] // borrowed
  | ["r", string, number] // repaid a debt line
  | ["s", number] // set aside (+) or drew down (−)
  | ["d", string]; // left a card for next month

export type MonthClose = {
  income: number;
  fixed: number;
  debtPaid: number;
  interest: number;
  /** Money moved back out of the cushion to cover the month. The receipt says so. */
  fromCushion: number;
  cashEnd: number;
  savingsEnd: number;
  debtEnd: number;
  familyCovered: boolean;
};

export type MonthJournal = { m: number; acts: JournalAct[]; end?: MonthClose };

export type MonthRecord = MonthClose & { m: number; cards: string[]; tier: StabilityTier };

export type RunState = {
  v: number;
  seed: number;
  personaId: PersonaId;
  name: string;
  status: "playing" | "ended";
  endReason?: EndReason;
  month: number;
  months: number;
  cash: number;
  savings: number;
  debts: DebtLine[];
  income: IncomeModel;
  incomeMods: { monthly: number; until: number }[];
  fixed: FixedCosts;
  fixedMods: { field: FixedField; monthly: number; until: number }[];
  tenancy: Tenancy;
  dependants: number;
  strain: number;
  familyCovered: boolean;
  flags: string[];
  usedCards: string[];
  drawn: string[];
  /** Cards left for next month. A card may appear here at most once. */
  deferred: string[];
  resolved: Record<string, { choiceId: string; outcomeIdx: number }>;
  history: MonthRecord[];
  journal: MonthJournal[];
  /** The `asOf` date of the newest fact this run was played against. */
  factsAsOf: string;
  weakSpots?: ConceptId[];
};

// ── Words and help ──────────────────────────────────────────────────────────
export type GlossaryTerm = {
  id: string;
  term: string;
  aliases?: string[];
  def: string;
  example?: string;
  fact?: FactId;
  concept?: ConceptId;
};

/**
 * A closed set, so a persona cannot name a service that does not exist — or one that
 * has closed. The first draft of this game carried an ethnic-minority NGO that had
 * been dissolved for eighteen months, and only a typed id makes that a build error
 * rather than a phone number a frightened person dials for nothing.
 */
export type HelpLineId =
  | "anti-scam"
  | "scameter"
  | "caritas-debt"
  | "twghs-debt"
  | "labour-general"
  | "eaa"
  | "labour-fdh"
  | "enrich"
  | "eoc"
  | "cheer"
  | "rvd-tenancy"
  | "basic-housing";

/**
 * What a person is trying to solve, in their words rather than the government's.
 *
 * Help is entered by problem, not by organisation: somebody whose landlord has just
 * put the rent up does not know that the body they want is the Rating and Valuation
 * Department, and should not have to. Every topic must hold at least two services, a
 * rule the engine checks — a topic that leads to a single phone number is a tap that
 * bought the player nothing, and the fix for that is content, not a screen.
 */
export type HelpTopic = "scam" | "money" | "work" | "home" | "unfair";

export type HelpLine = {
  id: HelpLineId;
  /** Which "what do you need help with?" answer leads here. */
  topic: HelpTopic;
  org: string;
  what: string;
  phone?: string;
  url?: string;
  hours?: string;
  personas: PersonaId[] | "all";
  concepts: ConceptId[];
  /** The page this was read off. Every number in this product traces to one. */
  source: string;
  /** ISO date the number was last confirmed against that page. */
  checkedOn: string;
  /** One plain sentence of caveat, when the source page carries one. */
  note?: string;
};
