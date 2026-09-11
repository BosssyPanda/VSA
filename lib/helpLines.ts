import type { HelpLine, HelpLineId, HelpTopic, Locale, PersonaId } from "./types";

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
    topic: "scam",
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
    topic: "scam",
    org: "Scameter",
    what: "A free police website. Type in a phone number, a website or a bank account. It tells you if people have reported it as a scam.",
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
    topic: "money",
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
    topic: "work",
    org: "Labour Department helper hotline",
    what: "Free government help about your job. Your pay, your rest days, your contract, or an agency that treats you badly.",
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
    topic: "money",
    org: "Enrich HK",
    what: "Free money classes for migrant domestic workers. How to save, how to spot a loan trap, and how to plan for going home.",
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
    topic: "unfair",
    org: "Equal Opportunities Commission",
    what: "Free help if someone treats you unfairly because of your race, your sex, a disability or your family. At work, at school, or when renting a home.",
    phone: "2511 8211",
    url: "https://www.eoc.org.hk/en/about-the-eoc/contact-us",
    hours: "Monday to Friday, 8:45am to 5:45pm",
    personas: "all",
    concepts: ["where-to-help", "rent-rights"],
    source: "https://www.eoc.org.hk/en/about-the-eoc/contact-us",
    checkedOn: HELP_LINES_CHECKED,
  },
  "basic-housing": {
    id: "basic-housing",
    topic: "home",
    org: "Subdivided flat standards line",
    what: "Ask the government whether your flat meets the rules on size, window, toilet and ceiling. This line is about the flat itself, not about the rent.",
    phone: "3611 0248",
    url: "https://www.bhu.gov.hk/eng/contact-us",
    hours: "Monday to Friday, 9am to 6pm",
    personas: "all",
    concepts: ["rent-rights", "where-to-help"],
    source: "https://www.bhu.gov.hk/eng/contact-us",
    checkedOn: HELP_LINES_CHECKED,
    note: "District teams near you can help a tenant in person. They are listed on the same site.",
  },
  "twghs-debt": {
    id: "twghs-debt",
    topic: "money",
    org: "Tung Wah debt counselling",
    what: "Free help from a counsellor if you owe money. They go through what you owe and help you decide what to pay first.",
    phone: "2548 0803",
    url: "https://fdcc.tungwahcsd.org/en/about-us-en/contact-us",
    hours: "Monday to Friday, 10am to 1pm and 2pm to 6pm. Also Friday 7pm to 10pm.",
    personas: "all",
    concepts: ["borrowing-cost", "where-to-help"],
    source: "https://fdcc.tungwahcsd.org/en/about-us-en/contact-us",
    checkedOn: HELP_LINES_CHECKED,
    // Their own contact page leads with this limit, and a player who expects a
    // bankruptcy application and gets advice has been let down by us, not by them.
    note: "They give advice only. They do not apply for bankruptcy or a repayment plan for you.",
  },
  "labour-general": {
    id: "labour-general",
    topic: "work",
    org: "Labour Department enquiry line",
    what: "Free government help about any job in Hong Kong. Ask about your pay, your hours, your rest days, or being dismissed.",
    phone: "2717 1771",
    url: "https://www.labour.gov.hk/eng/tele/content.htm",
    hours: "Any time, day or night",
    personas: "all",
    concepts: ["where-to-help"],
    source: "https://www.labour.gov.hk/eng/tele/content.htm",
    checkedOn: HELP_LINES_CHECKED,
    // The helper hotline below is for domestic workers only. Before this line existed,
    // two of the three lives in this game had nowhere at all to ask about a job.
    note: "The call is answered by the government's 1823 call centre.",
  },
  cheer: {
    id: "cheer",
    topic: "unfair",
    org: "CHEER Centre",
    what: "A free centre for people from ethnic minority communities. They give advice, help you deal with government offices, and translate for you on the phone.",
    phone: "3106 3104",
    url: "https://www.had.gov.hk/rru/english/programmes/support_service_centres.htm",
    hours: "Monday to Friday, office hours",
    personas: "all",
    concepts: ["where-to-help"],
    source: "https://www.had.gov.hk/rru/english/programmes/support_service_centres.htm",
    checkedOn: HELP_LINES_CHECKED,
    note: "They translate free of charge in Tagalog, Bahasa Indonesia, Urdu, Nepali, Hindi, Punjabi, Thai and Vietnamese.",
  },
  "rvd-tenancy": {
    id: "rvd-tenancy",
    topic: "home",
    org: "Subdivided flat rent line",
    what: "Free government help about the rent on a subdivided flat. They check what your landlord is allowed to charge, and you can report a landlord who charges too much.",
    phone: "2150 8303",
    url: "https://www.rvd.gov.hk/en/our_services/part_iva.html",
    hours: "Monday to Friday, office hours",
    personas: "all",
    concepts: ["rent-rights", "where-to-help"],
    // Read off the department's own press release of 24 April 2026, which is also the
    // most recent page on which the number appears.
    source: "https://www.rvd.gov.hk/en/press_releases/press_release_352.html",
    checkedOn: HELP_LINES_CHECKED,
    // This is the line that matches the rules the game actually teaches: the 10% cap on
    // a renewal rise, the two-month deposit limit, and the ban on marking up electricity.
    note: "This is the line for rent, deposit and electricity charges. Their own page tells you to call the interpretation line first if you need another language.",
  },
  eaa: {
    id: "eaa",
    topic: "work",
    org: "Employment agency complaints",
    what: "Free government help if an employment agency overcharges you or lies to you. An agency may charge you no more than one tenth of your first month's pay.",
    phone: "2115 3667",
    url: "https://www.eaa.labour.gov.hk/en/contact-us.html",
    hours: "Monday to Friday, office hours",
    personas: "all",
    concepts: ["borrowing-cost", "where-to-help"],
    source: "https://www.eaa.labour.gov.hk/en/contact-us.html",
    checkedOn: HELP_LINES_CHECKED,
    note: "You can complain in Tagalog, Bahasa Indonesia, Thai or Khmer on their online form.",
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

/**
 * The five answers to "What do you need help with?", in the order they are shown.
 *
 * Written as a person's problem, not as a category of government. Somebody whose
 * landlord has just raised the rent is not looking for "Tenancy Control of Subdivided
 * Units"; they are looking for "my flat or my rent". The plain wording is the whole
 * point of the screen, so it lives with the data rather than being invented by it.
 */
export const HELP_TOPICS: { id: HelpTopic; label: string; blurb: string }[] = [
  {
    id: "scam",
    label: "A message or call I do not trust",
    blurb: "Someone is asking you for money, for a code, or for your details.",
  },
  {
    id: "money",
    label: "Money I owe",
    blurb: "You borrowed money, or a payment is due that you cannot make.",
  },
  {
    id: "work",
    label: "A problem at work",
    blurb: "Your pay, your hours, your rest days, your contract, or an agency.",
  },
  {
    id: "home",
    label: "My flat or my rent",
    blurb: "Your rent, your deposit, your electricity bill, or the flat itself.",
  },
  {
    id: "unfair",
    label: "Being treated unfairly",
    blurb: "Someone treats you badly because of your race, your sex, a disability or your family.",
  },
];

/** Everything filed under one topic, for one life. */
export function helpLinesForTopic(topic: HelpTopic, personaId?: PersonaId): HelpLine[] {
  return HELP_LINE_IDS.map(helpLine).filter(
    (line) =>
      line.topic === topic &&
      (personaId === undefined ||
        line.personas === "all" ||
        line.personas.includes(personaId)),
  );
}

/**
 * Free telephone interpretation, run by CHEER for the Home Affairs Department.
 *
 * This is the most useful number in the file for the people this game is built for,
 * and it is the one almost nobody knows about. You call it in your own language and an
 * interpreter conference-calls the government office with you. The Rating and Valuation
 * Department's own tenancy page tells subdivided-flat tenants to use it, which is how
 * it was found.
 *
 * `locale` is set only where this product already has that language, so the Help screen
 * can lead with the line for the language the player is actually reading in. The rest
 * are listed because a player's language is very often not one of our three.
 */
export type InterpretationLine = {
  /** The language's name in English, for the English interface. */
  language: string;
  /** The language's name in itself, so it is recognisable to someone who cannot read the English. */
  endonym: string;
  phone: string;
  locale?: Locale;
};

export const INTERPRETATION_SOURCE =
  "https://www.had.gov.hk/rru/english/programmes/support_service_centres.htm";

export const INTERPRETATION_LINES: InterpretationLine[] = [
  { language: "Tagalog", endonym: "Tagalog", phone: "3755 6855", locale: "tl" },
  { language: "Bahasa Indonesia", endonym: "Bahasa Indonesia", phone: "3755 6811", locale: "id" },
  { language: "Urdu", endonym: "اردو", phone: "3755 6833" },
  { language: "Nepali", endonym: "नेपाली", phone: "3755 6822" },
  { language: "Hindi", endonym: "हिन्दी", phone: "3755 6877" },
  { language: "Punjabi", endonym: "ਪੰਜਾਬੀ", phone: "3755 6844" },
  { language: "Thai", endonym: "ไทย", phone: "3755 6866" },
  { language: "Vietnamese", endonym: "Tiếng Việt", phone: "3755 6888" },
];

/** The interpretation line for the language the player is reading in, if we have one. */
export function interpretationFor(locale: Locale): InterpretationLine | undefined {
  return INTERPRETATION_LINES.find((line) => line.locale === locale);
}
