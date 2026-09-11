import type { Card } from "@/lib/types";

/**
 * Cards every life can meet.
 *
 * Seven of them at this stage: enough to exercise every mechanic the engine has, and
 * enough to play a real month. The full deck lands with the content pass, and every
 * card here will go to community reviewers before it ships.
 *
 * House rules for a trap card, all enforced by content-lint:
 *   - the pitch is written the way the real message is written, and never winks
 *   - one to three plain reasons it may be risky, after the pitch, never inside it
 *   - safe choices first; the risky one is present, honest and quiet
 *   - `deferrable`, so nobody is ever forced to decide about money today
 */
export const SHARED_CARDS: Card[] = [
  {
    // Month one. Small, calm, and a real decision every Hong Kong resident makes at
    // some point — the opener has to teach the loop without asking anybody to risk
    // anything on their first screen.
    id: "auto-top-up",
    kind: "life",
    title: "Automatic top-up",
    prompt: "Your Octopus ran out at the turnstile again. There is a way to make it fill itself.",
    personas: "all",
    concepts: ["payments-cards", "cushion"],
    minMonth: 1,
    once: true,
    weight: 2,
    review: { persona: "shared", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "top-up-from-cash",
        kind: "primary",
        label: "Top it up from your own money",
        blurb: "It fills itself, and the money comes from what you already have.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["payments-cards"],
            effect: {},
            consequence: "It fills itself now. The money still comes out of your pocket, so you still feel it.",
            lesson: "Automatic is fine when the money is yours. It is borrowing when the money is the card's.",
          },
        ],
      },
      {
        id: "by-hand",
        kind: "secondary",
        label: "Keep topping up by hand",
        blurb: "Slower, and you see every dollar.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["payments-cards", "cushion"],
            effect: {},
            consequence: "You keep doing it at the machine. It takes a minute, and you always know what is on the card.",
            lesson: "Money you watch is money you keep. There is nothing wrong with the slow way.",
          },
        ],
      },
      {
        id: "link-a-card",
        kind: "quiet",
        label: "Link it to a credit card",
        blurb: "Then you never have to think about it.",
        outcomes: [
          {
            weight: 1,
            tone: "neutral",
            applied: false,
            concepts: ["payments-cards"],
            effect: { fixed: { field: "other", monthly: 150, months: 6 } },
            consequence: "You stop thinking about it, and spending about HK$ 150 a month more without noticing.",
            lesson: "When money leaves without you seeing it, it leaves faster. The bill arrives later and all at once.",
          },
        ],
      },
    ],
  },
  {
    id: "cash-in-30-minutes",
    kind: "trap",
    title: "Cash in 30 minutes",
    prompt: "A number you do not know has your name.",
    personas: "all",
    concepts: ["borrowing-cost", "scam-recognition"],
    facts: ["lender-apr-cap", "lender-extortionate-apr"],
    minMonth: 3,
    once: true,
    deferrable: true,
    weight: 3,
    pitch: {
      channel: "sms",
      from: "an unknown number",
      lines: [
        "Hi {name}! Cash HK$ 8,000 in 30 mins. No credit check.",
        "No need to tell your employer. Just send HKID photo + a friend's phone number as referee.",
        "Reply YES now, offer ends today.",
      ],
      tells: ["unknown-sender", "no-credit-check", "urgency", "asks-id-photo", "asks-employer-details"],
    },
    why: [
      "“No credit check” usually means a very high interest rate.",
      "A referee is a friend the lender can chase if you fall behind.",
      "“Ends today” is pressure. A safe offer can wait a week.",
    ],
    review: { persona: "shared", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "check-licence",
        kind: "primary",
        label: "Check if the lender is licensed",
        blurb: "Licensed lenders are listed, and cannot charge more than 48% a year.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["borrowing-cost", "where-to-help"],
            effect: {},
            consequence: "The number is not on the register. You keep your HKID photo, and your friend never gets a call.",
            lesson: "A licensed lender is on a public list and capped at 48% a year. Anyone above that is breaking the law, not doing you a favour.",
            tells: ["no-credit-check", "asks-id-photo"],
          },
        ],
      },
      {
        id: "block",
        kind: "secondary",
        label: "Block the number and tell someone",
        blurb: "Nothing is lost by walking away from this one.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["scam-recognition"],
            effect: {},
            consequence: "Blocked. Your friend says she got the same message last week.",
            lesson: "These messages go out in their thousands. Getting one says nothing about you.",
            tells: ["unknown-sender", "urgency"],
          },
        ],
      },
      {
        id: "reply-yes",
        kind: "quiet",
        label: "Reply YES",
        blurb: "The money would be in your hand tonight.",
        outcomes: [
          {
            weight: 3,
            tone: "bad",
            applied: false,
            concepts: ["borrowing-cost"],
            effect: {
              cash: 8000,
              addDebt: {
                kind: "unlicensed-lender",
                label: "Loan from the message",
                balance: 8000,
                apr: 0.6,
                instalment: 1200,
                referee: true,
              },
              strain: 0.1,
            },
            consequence:
              "HK$ 8,000 arrives the same night. The repayment is HK$ 1,200 a month, and the interest is 60% a year — above what the law allows.",
            lesson: "HK$ 8,000 at 60% a year costs about HK$ 400 a month in interest alone. One month looks small. Twelve months is the loan.",
            tells: ["no-credit-check", "urgency", "asks-id-photo"],
            setFlags: ["illegal-loan"],
          },
          {
            weight: 1,
            tone: "warning",
            applied: false,
            concepts: ["scam-recognition"],
            effect: { cash: -500 },
            consequence: "They ask for a HK$ 500 “handling fee” first. You pay it. No loan ever arrives.",
            lesson: "A real lender takes their fee out of the loan. Money asked for before the loan is the scam.",
            tells: ["upfront-fee"],
          },
        ],
      },
    ],
  },

  {
    id: "parcel-on-hold",
    kind: "trap",
    title: "Your parcel is on hold",
    prompt: "A message about a delivery you might be expecting.",
    personas: "all",
    concepts: ["scam-recognition"],
    facts: ["deception-share-of-crime"],
    minMonth: 2,
    once: true,
    deferrable: true,
    weight: 2,
    pitch: {
      channel: "sms",
      from: "HK POST",
      lines: [
        "Your parcel is on hold. Unpaid fee HK$ 12.",
        "Pay here in 24 hours or the parcel goes back: hkpost-delivery-pay.com/x9",
      ],
      tells: ["link-to-click", "urgency", "too-good"],
    },
    why: [
      "The fee is tiny so that you pay it without thinking. The card details are what they want.",
      "The web address is not the real Hongkong Post one.",
      "Nearly half of all reported crime in Hong Kong is now deception.",
    ],
    review: { persona: "shared", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "check-scameter",
        kind: "primary",
        label: "Check the link on Scameter+",
        blurb: "The police tool that tells you if an address or number has been reported.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["scam-recognition", "where-to-help"],
            effect: {},
            consequence: "Scameter+ flags the address in red. You never open it.",
            lesson: "Scameter+ and the 18222 helpline are free, and checking takes less time than the message gives you.",
            tells: ["link-to-click"],
          },
        ],
      },
      {
        id: "ignore",
        kind: "secondary",
        label: "Delete it",
        blurb: "A real delivery company will try again.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["scam-recognition"],
            effect: {},
            consequence: "Deleted. Nothing was ever on hold.",
            lesson: "If a message is real, ignoring it costs you a day. If it is not, ignoring it costs you nothing.",
            tells: ["unknown-sender"],
          },
        ],
      },
      {
        id: "pay",
        kind: "quiet",
        label: "Pay the HK$ 12",
        blurb: "It is only twelve dollars.",
        outcomes: [
          {
            weight: 3,
            tone: "bad",
            applied: false,
            concepts: ["scam-recognition", "payments-cards"],
            effect: { cash: -1800 },
            consequence: "The HK$ 12 goes through. So do three more charges that night, HK$ 1,800 in total.",
            lesson: "The small fee is a test of the card, not the point. Once they can charge it, they charge it again.",
            tells: ["link-to-click", "too-good"],
            setFlags: ["card-compromised"],
          },
          {
            weight: 1,
            tone: "warning",
            applied: false,
            concepts: ["scam-recognition"],
            effect: { cash: -12 },
            consequence: "The page never loads. You are out HK$ 12 and your card number is now on a list.",
            lesson: "Report it to 18222 anyway. The bank can watch the card before anything worse happens.",
            tells: ["link-to-click"],
          },
        ],
      },
    ],
  },

  {
    id: "hours-cut",
    kind: "life",
    title: "Fewer hours this month",
    prompt: "The roster went up and your name is on it less often.",
    personas: "all",
    concepts: ["cushion"],
    minMonth: 2,
    weight: 2,
    review: { persona: "shared", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "use-cushion",
        kind: "primary",
        label: "Use what you set aside",
        blurb: "This is the month the cushion is for.",
        requires: (c) => c.savings > 0,
        locked: "You have nothing set aside yet.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["cushion"],
            effect: { savings: -1200, cash: 1200 },
            consequence: "You move HK$ 1,200 across and the month closes level. No loan, no favour asked.",
            lesson: "A cushion is not savings for later. It is the month you do not have to borrow.",
          },
        ],
      },
      {
        id: "cut-back",
        kind: "secondary",
        label: "Spend less this month",
        blurb: "Cheaper food, walk where you can.",
        outcomes: [
          {
            weight: 2,
            tone: "neutral",
            applied: true,
            concepts: ["cushion"],
            effect: { fixed: { field: "food", monthly: -400, months: 1 } },
            consequence: "You spend HK$ 400 less on food. It is a long month, and it works.",
            lesson: "Cutting back covers a small gap. It does not cover a big one, which is why the cushion matters.",
          },
          {
            weight: 1,
            tone: "warning",
            applied: false,
            concepts: ["cushion"],
            effect: { cash: -300, strain: 0.05 },
            consequence: "You cut back, and still come up short. The gap goes on the card.",
            lesson: "When cutting back is not enough, the next thing is borrowing. That is the moment a cushion would have paid for itself.",
          },
        ],
      },
    ],
  },

  {
    id: "a-good-month",
    kind: "reward",
    title: "A thicker pay packet",
    prompt: "Extra hours, and the money is real.",
    personas: "all",
    concepts: ["cushion"],
    minMonth: 2,
    weight: 2,
    review: { persona: "shared", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "set-aside",
        kind: "primary",
        label: "Put it aside",
        blurb: "Into the cushion, where it is boring and useful.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["cushion"],
            effect: { savings: 1500 },
            consequence: "HK$ 1,500 goes into the cushion. Nothing happens, which is the idea.",
            lesson: "A cushion is built in good months, because bad months do not offer.",
          },
        ],
      },
      {
        id: "spend",
        kind: "secondary",
        label: "Spend some of it",
        blurb: "You have not bought anything for yourself in months.",
        outcomes: [
          {
            weight: 1,
            tone: "neutral",
            applied: true,
            concepts: ["cushion"],
            effect: { cash: -600, savings: 900 },
            consequence: "HK$ 600 on something you wanted, HK$ 900 put away. Both were allowed.",
            lesson: "A plan nobody can live with is not a plan. Spending some of a good month is how the rest survives.",
          },
        ],
      },
    ],
  },

  {
    id: "minimum-payment",
    kind: "life",
    title: "The minimum payment",
    prompt: "The statement says you only have to pay a small part of it.",
    personas: "all",
    concepts: ["payments-cards", "borrowing-cost"],
    minMonth: 4,
    once: true,
    weight: 2,
    requires: (c) => c.hasDebt("credit-card") || c.hasDebt("bnpl"),
    review: { persona: "shared", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "pay-more",
        kind: "primary",
        label: "Pay more than the minimum",
        blurb: "Whatever is spare, on top of what is demanded.",
        requires: (c) => c.cash > 500,
        locked: "There is nothing spare this month.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["payments-cards"],
            effect: { payDebt: { kind: "credit-card", amount: 500 }, cash: -500 },
            consequence: "HK$ 500 extra goes at the balance rather than the interest.",
            lesson: "A minimum payment is a rental fee on your own debt. Anything above it is the only part that shrinks it.",
          },
        ],
      },
      {
        id: "pay-minimum",
        kind: "quiet",
        label: "Pay the minimum",
        blurb: "It is what the statement asks for.",
        outcomes: [
          {
            weight: 1,
            tone: "warning",
            applied: false,
            concepts: ["payments-cards", "borrowing-cost"],
            effect: {},
            consequence: "The minimum goes out. The balance is almost exactly where it was.",
            lesson: "Paying the minimum on a card can take years and cost more than the thing you bought.",
          },
        ],
      },
    ],
  },

  {
    id: "friend-needs-2000",
    kind: "life",
    title: "A friend needs HK$ 2,000",
    prompt: "She has never asked you for anything before.",
    personas: "all",
    concepts: ["family-money"],
    minMonth: 3,
    once: true,
    weight: 2,
    review: { persona: "shared", reviewer: null, org: null, date: null, status: "draft" },
    choices: [
      {
        id: "lend-with-date",
        kind: "primary",
        label: "Lend it, and say when",
        blurb: "The amount and the date, out loud, today.",
        requires: (c) => c.cash >= 2000,
        locked: "You do not have HK$ 2,000 to lend.",
        outcomes: [
          {
            weight: 3,
            tone: "good",
            applied: true,
            concepts: ["family-money"],
            effect: { cash: -2000 },
            consequence: "You lend it and you both say the date out loud. She pays it back that week.",
            lesson: "Money between friends survives on a stated amount and a stated date. Silence is what breaks it.",
          },
          {
            weight: 1,
            tone: "warning",
            applied: true,
            concepts: ["family-money"],
            effect: { cash: -2000, strain: 0.05 },
            consequence: "She is late, and tells you why before you have to ask. It stays awkward, not broken.",
            lesson: "Lending to someone you love is a risk you can choose. Choose it with your eyes open, not by accident.",
          },
        ],
      },
      {
        id: "offer-less",
        kind: "secondary",
        label: "Offer what you can spare",
        blurb: "Less than she asked for, and no date needed.",
        outcomes: [
          {
            weight: 1,
            tone: "good",
            applied: true,
            concepts: ["family-money", "cushion"],
            effect: { cash: -500 },
            consequence: "You give HK$ 500 and say it is not a loan. She takes it, and asks her brother for the rest.",
            lesson: "Giving a smaller amount you can afford beats lending a larger one you cannot.",
          },
        ],
      },
      {
        id: "borrow-to-lend",
        kind: "quiet",
        label: "Borrow so you can help",
        blurb: "She would do it for you.",
        outcomes: [
          {
            weight: 1,
            tone: "bad",
            applied: false,
            concepts: ["family-money", "borrowing-cost"],
            effect: {
              cash: -2000,
              addDebt: {
                kind: "credit-card",
                label: "Card advance",
                balance: 2000,
                apr: 0.36,
                minPct: 0.03,
              },
              strain: 0.05,
            },
            consequence: "You take HK$ 2,000 on the card so she does not have to ask anyone else. Now the interest is yours.",
            lesson: "Borrowing to lend moves someone else's problem onto your interest bill. Help with what you have, not with what you owe.",
          },
        ],
      },
    ],
  },
];
