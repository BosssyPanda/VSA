import { fact } from "./facts";
import type { Persona, PersonaId } from "./types";

/**
 * Three lives in one city.
 *
 * The starting figures are ILLUSTRATIVE, and the game says so. Only the rates they are
 * built from are facts: Amir is paid the statutory minimum wage, Maria is paid the
 * Minimum Allowable Wage, and the caps that protect Mrs Chan's tenancy are the real
 * ones. Rents, shopping and what a family expects vary far too much between households
 * to be stated as a figure with a source, so they are drawn as a plausible month and
 * handed to the community reviewers to correct.
 *
 * None of these three is a victim or a cautionary tale. Each of them is competent,
 * working, and one bad month away from a loan — which is the actual condition the game
 * is about.
 */

/**
 * Starting money is an illustration, and the game says so.
 *
 * Shown on the life picker and on the Figures screen. Without it a player could
 * reasonably read Maria's agency balance as a statistic about domestic workers, which
 * it is not — only the rules around it (the 10% fee cap, the 48% interest ceiling) are.
 */
export const FIGURES_ARE_ILLUSTRATIVE = true;

/** Roughly six days a week of shift work. */
const HOURS_FULL_TIME = 230;

/** Cleaning work, taken where it is offered. A thin month is a real month. */
const HOURS_VARIABLE = 200;

export const PERSONAS: Record<PersonaId, Persona> = {
  "sa-youth": {
    id: "sa-youth",
    name: "Amir",
    age: 22,
    district: "Yau Ma Tei",
    job: "Security guard",
    blurb: "Born in Hong Kong. Works shifts, lives at home, gives some of every pay packet to the family.",
    guideName: "Cousin",
    start: {
      cash: 1500,
      savings: 0,
      debts: [],
      income: {
        kind: "hourly",
        rateFact: "min-wage-hourly",
        hoursBase: HOURS_FULL_TIME,
        hoursJitter: 20,
      },
      fixed: { housing: 0, food: 2200, transport: 700, family: 3500, other: 1000 },
      tenancy: { kind: "board" },
      dependants: 0,
      flags: ["lives-with-family"],
    },
    helpLines: ["unison", "scameter", "anti-scam", "labour"],
    partnerOrg: "Ethnic minority and domestic worker NGO partner",
  },

  mdw: {
    id: "mdw",
    name: "Maria",
    age: 34,
    district: "Mid-Levels",
    job: "Domestic worker",
    blurb: "Live-in helper. Sends most of her wage home every month, and is still paying off the agency.",
    guideName: "Cousin",
    start: {
      cash: 600,
      savings: 0,
      debts: [
        {
          kind: "agency",
          label: "Agency loan",
          balance: 4100,
          apr: 0.3,
          instalment: 915,
        },
      ],
      income: {
        kind: "mdw",
        wageFact: "mdw-min-wage",
        foodFact: "mdw-food-allowance",
        remittance: 2800,
      },
      // Live-in, so no rent. The remittance is the family line, and it is not optional
      // in any sense that matters to her.
      fixed: { housing: 0, food: 0, transport: 200, family: 2800, other: 600 },
      tenancy: { kind: "live-in" },
      dependants: 2,
      flags: ["live-in", "sends-money-home"],
    },
    helpLines: ["enrich", "labour-fdh", "anti-scam", "scameter"],
    partnerOrg: "Ethnic minority and domestic worker NGO partner",
  },

  "sdu-family": {
    id: "sdu-family",
    name: "Mrs Chan",
    age: 41,
    district: "Sham Shui Po",
    job: "Cleaner",
    blurb: "Raising a daughter in a subdivided flat. Takes the hours she is offered, and some months there are fewer.",
    guideName: "Cousin",
    start: {
      cash: 2000,
      savings: 0,
      debts: [],
      // Paid by the hour at the statutory minimum, with the hours moving month to
      // month. In a thin month her pay drops under the MPF floor and she contributes
      // nothing — which is a real rule worth meeting rather than a rounding detail.
      income: {
        kind: "hourly",
        rateFact: "min-wage-hourly",
        hoursBase: HOURS_VARIABLE,
        hoursJitter: 40,
      },
      fixed: { housing: 4200, food: 2200, transport: 400, family: 0, other: 500 },
      tenancy: {
        kind: "sdu-rent",
        termMonths: 24,
        depositMonths: fact("sdu-deposit-max-months"),
        riseCapPct: fact("sdu-rent-rise-cap-pct"),
        // Her two-year term ends inside this year, which is the point: the rent review
        // is a scene, not a background number.
        nextReviewMonth: 8,
        pendingRisePct: 0,
      },
      dependants: 1,
      flags: ["subdivided-flat", "waiting-for-public-housing"],
    },
    helpLines: ["caritas", "soco", "anti-scam", "scameter"],
    // Nobody has reviewed this life yet, and the game says so on her tile and on her
    // final statement rather than hoping a player will not notice.
    partnerOrg: null,
  },
};

export const PERSONA_IDS = Object.keys(PERSONAS) as PersonaId[];

export function getPersona(id: PersonaId): Persona {
  return PERSONAS[id] ?? PERSONAS["sa-youth"];
}

/** True when this life has not yet been checked by anyone who has lived it. */
export function needsCommunityReview(id: PersonaId): boolean {
  return PERSONAS[id].partnerOrg === null;
}
