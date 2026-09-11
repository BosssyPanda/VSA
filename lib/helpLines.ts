import type { HelpLine, HelpLineId, PersonaId } from "./types";

/**
 * Free help, with the number checked.
 *
 * Every entry here was read off the organisation's own site or a government page on
 * the date in `checkedOn`, and the page it was read from is in `source`. That is not
 * bureaucracy. A wrong number in a product aimed at somebody who has just been scammed
 * is worse than no number: they call it, nothing happens, and they conclude that
 * asking for help does not work.
 *
 * Two rules, both learned the hard way while compiling this list:
 *
 *   1. Nothing goes in unverified. Hong Kong Unison — the ethnic-minority rights NGO
 *      that every list of this kind still carries — voted to disband in February 2025,
 *      and in July 2026 its liquidators published a notice disclaiming the site now
 *      running at its old domain and warning that requests for donations and personal
 *      data there do not come from them. It was in this file's first draft. Pointing a
 *      low-income ethnic-minority player at that domain is precisely the harm this
 *      product exists to prevent.
 *
 *   2. Nothing is promised that the page does not say. Where a hotline does not
 *      publish which languages it answers in, this file does not claim any.
 *
 * Re-check every number before each release, and update `checkedOn` when you do.
 */

/** The date every entry below was last read off its source page. */
export const HELP_LINES_CHECKED = "2026-09-11";

export const HELP_LINES: Record<HelpLineId, HelpLine> = {
  "anti-scam": {
    id: "anti-scam",
    org: "Anti-Scam Helpline 18222",
    what: "Call this free number if you think someone is trying to trick you out of your money. A police officer will talk it through with you.",
    phone: "18222",
    url: "https://www.adcc.gov.hk/en-hk/contact-us.html",
    hours: "Any time, day or night",
    personas: "all",
    concepts: ["scam-recognition", "where-to-help"],
    source: "https://www.adcc.gov.hk/en-hk/contact-us.html",
    checkedOn: HELP_LINES_CHECKED,
    // The page is explicit that this is advice, not a crime report, and the
    // difference matters to somebody who has already lost money.
    note: "This line is for advice. To report a crime, go to a police station. In an emergency, call 999.",
  },
  scameter: {
    id: "scameter",
    org: "Scameter",
    what: "A free police website. Type in a phone number, a website or a bank account, and it tells you if people have reported it as a scam.",
    url: "https://cyberdefender.hk/en-us/scameter/",
    personas: "all",
    concepts: ["scam-recognition", "where-to-help"],
    source: "https://cyberdefender.hk/en-us/scameter/",
    checkedOn: HELP_LINES_CHECKED,
    // Two names are live at once, and a phishing copy of the site exists, so the
    // exact address is part of the safety advice rather than a detail.
    note: "The phone app is called Scameter+. The website is in English and Chinese only.",
  },
  "caritas-debt": {
    id: "caritas-debt",
    org: "Caritas debt counselling",
    what: "Free help from a social worker if you owe money you cannot pay back. They explain your choices and help you make a plan.",
    phone: "3161 0102",
    url: "https://family.caritas.org.hk/eng/service03_debt",
    hours: "Any time, day or night",
    personas: "all",
    concepts: ["borrowing-cost", "where-to-help"],
    source: "https://family.caritas.org.hk/eng/service03_debt",
    checkedOn: HELP_LINES_CHECKED,
    note: "Their family crisis line is 18288, also day and night.",
  },
  "labour-fdh": {
    id: "labour-fdh",
    org: "Labour Department helper hotline",
    what: "Free government help about your job: your pay, your rest days, your contract, or an agency that is treating you badly.",
    phone: "2157 9537",
    url: "https://www.fdh.labour.gov.hk/en/contact_us.html",
    hours: "Any time, day or night",
    personas: ["mdw"],
    concepts: ["where-to-help", "family-money"],
    source: "https://www.fdh.labour.gov.hk/en/contact_us.html",
    checkedOn: HELP_LINES_CHECKED,
    // The language support on this line traces to a 2018 press release and could not
    // be re-confirmed on a current page, so it is not promised here.
    note: "If you are in danger, call 999.",
  },
  enrich: {
    id: "enrich",
    org: "Enrich HK",
    what: "Free money classes for migrant domestic workers: how to save, how to spot a loan trap, and how to plan for going home.",
    phone: "5981 3754",
    url: "https://enrichhk.org/contact-enrich",
    hours: "Call or WhatsApp",
    personas: ["mdw"],
    concepts: ["cushion", "borrowing-cost", "where-to-help"],
    source: "https://enrichhk.org/contact-enrich",
    checkedOn: HELP_LINES_CHECKED,
    note: "5981 3754 for English and Tagalog. 5648 0990 for Bahasa Indonesia.",
  },
  eoc: {
    id: "eoc",
    org: "Equal Opportunities Commission",
    what: "Free help if someone treats you unfairly because of your race, your sex, a disability or your family. At work, at school, or when renting a home.",
    phone: "2511 8211",
    url: "https://www.eoc.org.hk/en/about-the-eoc/contact-us",
    hours: "Monday to Friday, 8:45am to 5:45pm",
    personas: ["sa-youth", "sdu-family"],
    concepts: ["where-to-help", "rent-rights"],
    source: "https://www.eoc.org.hk/en/about-the-eoc/contact-us",
    checkedOn: HELP_LINES_CHECKED,
  },
  "basic-housing": {
    id: "basic-housing",
    org: "Subdivided flats enquiry line",
    what: "Ask the government about the rules for subdivided flats: whether your flat is registered, and what the rules mean for you as a tenant.",
    phone: "3611 0248",
    url: "https://www.bhu.gov.hk/eng/contact-us",
    hours: "Monday to Friday, 9am to 6pm",
    personas: ["sdu-family"],
    concepts: ["rent-rights", "where-to-help"],
    source: "https://www.bhu.gov.hk/eng/contact-us",
    checkedOn: HELP_LINES_CHECKED,
    note: "District teams near you can help a tenant in person. They are listed on the same site.",
  },
};

export const HELP_LINE_IDS = Object.keys(HELP_LINES) as HelpLineId[];

export function helpLine(id: HelpLineId): HelpLine {
  return HELP_LINES[id];
}

/** Everything written for this life, in the order the file declares them. */
export function helpLinesForPersona(personaId: PersonaId): HelpLine[] {
  return HELP_LINE_IDS.map(helpLine).filter(
    (line) => line.personas === "all" || line.personas.includes(personaId),
  );
}
