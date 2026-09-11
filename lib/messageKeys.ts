/**
 * Every string key the screens build from an id, checked by the compiler.
 *
 * A screen reaches most of its strings by name — `t("month.close")` — and
 * `qa:messages` catches a typo in one of those. But nine of them are built from an
 * id at runtime: `` t(`helpLine.${line.id}.org`) ``. The audit can only read that as
 * the pattern `helpLine.*.org`, and a pattern that matches one key looks satisfied
 * even when it should match twelve. So adding a twelfth help line to the engine and
 * forgetting its words put `helpLine.rvd-tenancy.org` on screen, in front of somebody
 * who had opened the Help page because they needed a phone number.
 *
 * The fix is not another script. Every one of those ids is a closed union already, so
 * the requirement can be stated as a type: expand the union into the key it produces
 * and assert the catalogue has it. `tsc --noEmit` then names the missing key, at the
 * moment the union grows, before anything runs.
 *
 * This file is types only. It emits nothing and nothing imports it — `npm run
 * typecheck` compiles it because it is in the project, and that is the whole job.
 *
 * Optional fields cannot be stated this way (`hours` and `note` exist on some help
 * lines and not others), and neither can "the words in the catalogue are the words in
 * the engine". `scripts/qa/messages-audit.mjs` holds both of those.
 */
import type { PlayerLoanKind } from "./debt";
import type { ShareOutcome } from "./share";
import type {
  FactId,
  FixedCosts,
  HelpLineId,
  PersonaId,
  StabilityTier,
  TellId,
  TrapPitch,
} from "./types";

/** The keys English actually ships. */
type MessageKey = keyof typeof import("@/messages/en.json");

/**
 * Fails to compile unless every key in `K` is in the catalogue.
 *
 * The error reads "Type '"helpLine.eaa.org"' does not satisfy the constraint" and
 * names the key that is missing, which is the only thing the reader needs.
 */
type Needs<K extends MessageKey> = K;

type _channels = Needs<`channel.${TrapPitch["channel"]}`>;
type _facts = Needs<`fact.${FactId}.label`>;
type _helpLines = Needs<`helpLine.${HelpLineId}.${"org" | "what"}`>;
type _loanKinds = Needs<`borrow.kind.${PlayerLoanKind}`>;
type _personas = Needs<`persona.${PersonaId}.${"name" | "who" | "blurb"}`>;
type _shareOutcomes = Needs<`final.shared.${ShareOutcome}`>;
type _fixedCosts = Needs<`outcome.fixed.${keyof FixedCosts}`>;
type _tells = Needs<`tell.${TellId}`>;
type _tiers = Needs<`tier.${StabilityTier}.${"title" | "blurb"}`>;

export {};
