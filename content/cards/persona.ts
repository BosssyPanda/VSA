import type { Card } from "@/lib/types";

/**
 * Cards only one life meets.
 *
 * These carry the most weight and the most risk of getting somebody's life wrong, so
 * they are also the ones that will not ship without a reviewer from that community
 * signing them off by name.
 */
export const PERSONA_CARDS: Card[] = [
  {
    id: "agency-wants-more",
    kind: "trap",
    title: "The agency wants more",
    prompt: "The office calls about a fee you have already paid once.",
    personas: ["mdw", "sa-youth"],
    concepts: ["borrowing-cost", "where-to-help"],
    facts: ["agency-fee-cap-pct", "mdw-min-wage"],
    minMonth: 3,
    once: true,
    deferrable: true,
    weight: 3,
    pitch: {
      channel: "call",
      from: "the agency",
      lines: [
        "There is a processing fee outstanding. HK$ 3,000.",
        "You can pay it monthly from your salary, we arrange everything.",
        "If you do not pay, we cannot help with your next contract.",
      ],
      tells: ["upfront-fee", "pay-to-get-job", "keep-it-secret"],
    },
    why: [
      "An agency may take at most 10% of your first month's wages from you, and only after you have the job.",
      "Taking it monthly from your salary is a deduction, and deductions from wages are tightly limited by law.",
      "“We cannot help with your next contract” is pressure, not a rule.",
    ],
    review: { persona: "mdw", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "call-labour",
        kind: "primary",
        label: "Call the Labour Department first",
        blurb: "Free, and they deal with this every day.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["where-to-help", "borrowing-cost"],
            effect: {},
            consequence:
              "They tell you the cap is 10% of your first month's wages, once. The agency stops asking when you say you have called.",
            lesson: "On HK$ 5,100 a month, the most an agency may ever charge you is HK$ 510. Anything more is an offence.",
            tells: ["upfront-fee", "pay-to-get-job"],
          },
        ],
      },
      {
        id: "ask-for-receipt",
        kind: "secondary",
        label: "Ask for a receipt in writing",
        blurb: "Anything legitimate comes with one.",
        outcomes: [
          {
            weight: 2,
            tone: "good",
            applied: true,
            concepts: ["where-to-help"],
            effect: {},
            consequence: "They will not put it in writing. The call ends, and so does the fee.",
            lesson: "A receipt is your evidence. A fee nobody will write down is a fee nobody should pay.",
            tells: ["keep-it-secret"],
          },
          {
            weight: 1,
            tone: "neutral",
            applied: true,
            concepts: ["where-to-help"],
            effect: {},
            consequence: "They send a receipt for HK$ 510 instead, which is the legal amount. You pay that and nothing more.",
            lesson: "Asking for the paperwork is often all it takes to bring a fee back inside the law.",
          },
        ],
      },
      {
        id: "agree-monthly",
        kind: "quiet",
        label: "Agree to pay monthly",
        blurb: "It keeps the relationship with the agency.",
        outcomes: [
          {
            weight: 1,
            tone: "bad",
            applied: false,
            concepts: ["borrowing-cost"],
            effect: {
              addDebt: {
                kind: "agency",
                label: "Agency fee, paid monthly",
                balance: 3000,
                apr: 0.24,
                instalment: 600,
              },
              strain: 0.05,
            },
            consequence: "HK$ 600 a month for six months, with interest folded in that nobody named out loud.",
            lesson: "“Pay it monthly” is a loan. Ask what the total comes to before you agree to the instalment.",
            tells: ["upfront-fee", "pay-to-get-job"],
          },
        ],
      },
    ],
  },

  {
    id: "rent-review",
    kind: "life",
    title: "The landlord wants 15% more",
    prompt: "Your two years are up, and he has written a number on a piece of paper.",
    personas: ["sdu-family"],
    concepts: ["rent-rights"],
    facts: ["sdu-rent-rise-cap-pct", "sdu-deposit-max-months"],
    minMonth: 6,
    once: true,
    weight: 4,
    review: { persona: "sdu-family", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "cite-the-cap",
        kind: "primary",
        label: "Tell him what the cap is",
        blurb: "At renewal the rent may rise at most 10%.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["rent-rights"],
            effect: { rentRisePct: 0.15 },
            consequence:
              "He shrugs and writes a smaller number. The law caps the rise at 10%, so that is what it rises by.",
            lesson: "A regulated tenancy gives you four years and a 10% ceiling at renewal. Knowing the number is most of the protection.",
          },
        ],
      },
      {
        id: "ask-for-written-tenancy",
        kind: "secondary",
        label: "Ask for the tenancy in writing",
        blurb: "A written tenancy is what the protections hang on.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["rent-rights", "where-to-help"],
            effect: { rentRisePct: 0.1 },
            consequence: "He writes it up. The rise is inside the cap, and now you have the paper that proves your term.",
            lesson: "Get the tenancy in writing and stamped. Without it, every other right is harder to use.",
          },
        ],
      },
      {
        id: "just-pay",
        kind: "quiet",
        label: "Pay what he asks",
        blurb: "Moving would cost more than the difference.",
        outcomes: [
          {
            weight: 1,
            tone: "bad",
            applied: false,
            concepts: ["rent-rights"],
            effect: { rentRisePct: 0.15, strain: 0.05 },
            consequence: "You agree to 15%. The engine holds him to 10% because the law does, but you did not know that, and next time he will ask for more.",
            lesson: "The cap protects you whether or not you ask for it. Asking is how you find out it exists.",
          },
        ],
      },
    ],
  },

  {
    id: "send-more-home",
    kind: "life",
    title: "They need more at home",
    prompt: "A message from home. The roof, and the school fees, in the same month.",
    personas: ["mdw", "sa-youth"],
    concepts: ["family-money", "cushion"],
    minMonth: 4,
    once: true,
    weight: 3,
    review: { persona: "mdw", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "send-what-you-can",
        kind: "primary",
        label: "Send what you can, and say so",
        blurb: "A smaller number, named clearly, this month only.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["family-money"],
            effect: { fixed: { field: "family", monthly: 600, months: 1 }, strain: 0.05 },
            consequence: "You send HK$ 600 extra and tell them it is once, not every month. They understand.",
            lesson: "Saying the number and the month keeps a favour from turning into an expectation.",
          },
        ],
      },
      {
        id: "borrow-and-send",
        kind: "quiet",
        label: "Borrow it and send the full amount",
        blurb: "It is your family, and they asked.",
        outcomes: [
          {
            weight: 1,
            tone: "bad",
            applied: false,
            concepts: ["family-money", "borrowing-cost"],
            effect: {
              cash: -2500,
              addDebt: {
                kind: "licensed-lender",
                label: "Finance company loan",
                balance: 2500,
                apr: 0.4,
                instalment: 500,
              },
            },
            consequence: "The full amount goes home the same day. HK$ 500 a month comes out of yours for the next six.",
            lesson: "Borrowing to send money home means your family's emergency becomes your interest bill. The help is real; so is the price.",
          },
        ],
      },
    ],
  },

  {
    id: "contract-in-chinese",
    kind: "life",
    title: "The contract is only in Chinese",
    prompt: "The letting agent slides it across and offers you a pen.",
    personas: ["sa-youth"],
    concepts: ["rent-rights", "where-to-help"],
    minMonth: 3,
    once: true,
    weight: 2,
    review: { persona: "sa-youth", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "get-it-explained",
        kind: "primary",
        label: "Get it explained before signing",
        blurb: "Free interpreting and advice exist for exactly this.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["where-to-help", "rent-rights"],
            effect: {},
            consequence: "Someone goes through it with you. Two clauses are not what the agent said they were.",
            lesson: "Free interpreting and tenancy advice exist for ethnic minority residents. Using them is ordinary, not a favour.",
          },
        ],
      },
      {
        id: "take-a-photo",
        kind: "secondary",
        label: "Photograph it and take it away",
        blurb: "Nothing has to be signed in the room.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["rent-rights"],
            effect: {},
            consequence: "You take it home. The agent is annoyed, which is not your problem.",
            lesson: "Nobody can require you to sign a document in the room. Taking it away is always allowed.",
          },
        ],
      },
      {
        id: "sign-it",
        kind: "quiet",
        label: "Sign it",
        blurb: "He says it is the standard one.",
        outcomes: [
          {
            weight: 1,
            tone: "bad",
            applied: false,
            concepts: ["rent-rights"],
            effect: { cash: -1500 },
            consequence: "A cleaning charge you did not know about comes out of the deposit three months later.",
            lesson: "A document you cannot read is a document you have not agreed to. Get it read first.",
          },
        ],
      },
    ],
  },
];
