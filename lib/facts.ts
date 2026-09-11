import type { Fact, FactId } from "./types";

/**
 * The facts ledger.
 *
 * Every figure this game shows a player traces to an entry here, and every entry
 * carries the date it was true and a link to where it came from. The Figures screen
 * renders this file directly, so there is no version of it that is up to date in the
 * code and stale on screen.
 *
 * Why the discipline. The audience for this game is sold confident numbers every
 * week by people who benefit from them being wrong. A financial-literacy game that
 * invents plausible figures teaches the same habit it is trying to break. If a number
 * cannot be sourced, it does not go here: it goes in a persona as an illustration and
 * is labelled as one.
 *
 * MAINTENANCE. Check this file at every release. Three of these move on a schedule:
 * the statutory minimum wage is now reviewed every year and changes on 1 May; the
 * Minimum Allowable Wage for domestic workers is normally announced in late September;
 * the public-housing waiting time is published quarterly.
 */
export const FACTS: Record<FactId, Fact> = {
  "min-wage-hourly": {
    id: "min-wage-hourly",
    label: "Statutory minimum wage",
    value: 43.1,
    unit: "HKD/hr",
    asOf: "2026-05-01",
    source: { name: "Labour Department", url: "https://www.labour.gov.hk/eng/news/mwo.htm" },
    note: "The least an employer may pay for an hour of work. It rose from HK$42.1 on 1 May 2026 and is now reviewed every year.",
  },
  "mdw-min-wage": {
    id: "mdw-min-wage",
    label: "Minimum wage for a domestic worker",
    value: 5100,
    unit: "HKD/month",
    asOf: "2025-09-30",
    source: {
      name: "Labour Department",
      url: "https://www.labour.gov.hk/eng/plan/iwFDH.htm",
    },
    note: "For contracts signed on or after 30 September 2025. It was HK$4,990 before that. Paying less is a criminal offence.",
  },
  "mdw-food-allowance": {
    id: "mdw-food-allowance",
    label: "Food allowance for a domestic worker",
    value: 1236,
    unit: "HKD/month",
    asOf: "2025-09-30",
    source: {
      name: "Labour Department",
      url: "https://www.labour.gov.hk/eng/plan/iwFDH.htm",
    },
    note: "Paid on top of wages when the employer does not provide free food. It is never part of the HK$5,100.",
  },
  "agency-fee-cap-pct": {
    id: "agency-fee-cap-pct",
    label: "Most an agency may charge you",
    value: 0.1,
    unit: "pct",
    asOf: "2018-02-09",
    source: {
      name: "Labour Department, Employment Agency Regulations",
      url: "https://www.labour.gov.hk/eng/legislat/content2.htm",
    },
    note: "An employment agency may take at most 10% of your first month's wages, and only after you get the job. More than that is an offence.",
  },
  "mpf-rate": {
    id: "mpf-rate",
    label: "MPF contribution",
    value: 0.05,
    unit: "pct",
    asOf: "2014-06-01",
    source: { name: "MPFA", url: "https://www.mpfa.org.hk/en/mpf-system/system-features/mpf-contributions" },
    note: "You put in 5% of your pay and your employer puts in 5%. It is your retirement money, not a tax.",
  },
  "mpf-exempt-floor": {
    id: "mpf-exempt-floor",
    label: "Pay below which you contribute nothing",
    value: 7100,
    unit: "HKD/month",
    asOf: "2013-11-01",
    source: { name: "MPFA", url: "https://www.mpfa.org.hk/en/mpf-system/system-features/mpf-contributions" },
    note: "Earn under HK$7,100 in a month and you pay nothing. Your employer still pays their 5%.",
  },
  "mpf-income-cap": {
    id: "mpf-income-cap",
    label: "Pay above which contributions stop rising",
    value: 30000,
    unit: "HKD/month",
    asOf: "2014-06-01",
    source: { name: "MPFA", url: "https://www.mpfa.org.hk/en/mpf-system/system-features/mpf-contributions" },
  },
  "mpf-contribution-cap": {
    id: "mpf-contribution-cap",
    label: "Most you contribute in a month",
    value: 1500,
    unit: "HKD/month",
    asOf: "2014-06-01",
    source: { name: "MPFA", url: "https://www.mpfa.org.hk/en/mpf-system/system-features/mpf-contributions" },
  },
  "lender-apr-cap": {
    id: "lender-apr-cap",
    label: "Highest legal interest rate",
    value: 0.48,
    unit: "pct",
    asOf: "2022-12-30",
    source: {
      name: "Money Lenders Ordinance (Cap. 163), s.24",
      url: "https://www.news.gov.hk/eng/2022/10/20221026/20221026_170442_560.html",
    },
    note: "Lending above 48% a year is a criminal offence, and the loan cannot be enforced. The cap was 60% before 30 December 2022.",
  },
  "lender-extortionate-apr": {
    id: "lender-extortionate-apr",
    label: "Rate a court may treat as extortionate",
    value: 0.36,
    unit: "pct",
    asOf: "2022-12-30",
    source: {
      name: "Money Lenders Ordinance (Cap. 163), s.25",
      url: "https://www.news.gov.hk/eng/2022/10/20221026/20221026_170442_560.html",
    },
    note: "Above 36% a year, a court starts from the position that the loan is unfair and may rewrite it.",
  },
  "sdu-deposit-max-months": {
    id: "sdu-deposit-max-months",
    label: "Most deposit a subdivided-flat landlord may take",
    value: 2,
    unit: "months",
    asOf: "2022-01-22",
    source: {
      name: "Housing Bureau, tenancy control on subdivided units",
      url: "https://www.hb.gov.hk/eng/policy/housing/policy/tenancy_control/index.html",
    },
    note: "Two months' rent, no more. You also get four years of security: two years, then two more if you want them.",
  },
  "sdu-rent-rise-cap-pct": {
    id: "sdu-rent-rise-cap-pct",
    label: "Most the rent may rise at renewal",
    value: 0.1,
    unit: "pct",
    asOf: "2022-01-22",
    source: {
      name: "Housing Bureau, tenancy control on subdivided units",
      url: "https://www.hb.gov.hk/eng/policy/housing/policy/tenancy_control/index.html",
    },
    note: "At renewal the rent may rise by no more than the official rental index, and never by more than 10%.",
  },
  "prh-wait-years": {
    id: "prh-wait-years",
    label: "Wait for public rental housing",
    value: 4.8,
    unit: "years",
    asOf: "2026-06-30",
    source: {
      name: "Housing Bureau, Composite Waiting Time",
      url: "https://www.hb.gov.hk/eng/publications/housing/cwt/index.html",
    },
    note: "The average wait for a general applicant housed in the past year, counting Light Public Housing. For a public rental flat alone it was 5.5 years.",
  },
  "sdu-count": {
    id: "sdu-count",
    label: "People living in subdivided flats",
    value: 220000,
    unit: "people",
    asOf: "2025-10-03",
    source: {
      name: "Government press release on the Basic Housing Units Ordinance",
      url: "https://www.info.gov.hk/gia/general/202510/03/P2025100200765.htm",
    },
    note: "About 110,000 subdivided flats, home to about 220,000 people. From 1 March 2026 they must be registered and meet minimum standards.",
  },
  "deception-share-of-crime": {
    id: "deception-share-of-crime",
    label: "Share of all reported crime that is deception",
    value: 0.485,
    unit: "pct",
    asOf: "2025-12-31",
    source: {
      name: "Hong Kong Police Force, law and order in 2025",
      url: "https://www.police.gov.hk/ppp_en/01_about_us/cp_ye.html",
    },
    note: "43,212 deception cases in 2025, nearly half of all reported crime, and about HK$8.1 billion lost. Being fooled is ordinary here, not stupid.",
  },
  "cpi-yoy": {
    id: "cpi-yoy",
    label: "How fast prices are rising",
    value: 0.017,
    unit: "pct",
    asOf: "2026-03-31",
    source: {
      name: "Census and Statistics Department, Composite Consumer Price Index",
      url: "https://www.info.gov.hk/gia/general/202604/23/P2026042300351.htm",
    },
    note: "Prices were 1.7% higher than a year before. It is why the same shopping costs a little more each year.",
  },
};

/** Convenience: the numeric value of a fact. */
export function fact(id: FactId): number {
  return FACTS[id].value;
}

export function factOf(id: FactId): Fact {
  return FACTS[id];
}

/**
 * The newest date any figure in this build was true.
 *
 * Shown as "Figures as of ..." wherever money appears. It is the max rather than a
 * hand-written constant so that updating one fact updates the claim on screen, and so
 * that nobody can update a number and forget to move the date.
 */
export const FACTS_AS_OF: string = Object.values(FACTS)
  .map((f) => f.asOf)
  .sort()
  .at(-1) as string;

/** Every fact, oldest first, for the Figures screen. */
export function allFacts(): Fact[] {
  return Object.values(FACTS).sort((a, b) => (a.asOf < b.asOf ? 1 : -1));
}
