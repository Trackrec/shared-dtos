/**
 * The Rundown benchmarks. GET /rundown/benchmarks, own user, JWT.
 *
 * WHAT THIS IS. The contract for the rebuilt Rundown, the screen a candidate
 * sees about their own career. Victor, 2026-09-08, on the current one: "Right
 * now this screen says pretty much nothing, even on a great year it takes so
 * much space." And the brief for what replaces it: "I want TrackRec to know
 * stuff about sellers that they do not even know yet themselves."
 *
 * THE PAGE, top to bottom. Band 1 is the estimate: what you are worth, the
 * range, the base and variable split, five short lines on how we got here, the
 * great year as one line. That band is served by the estimate the profile
 * already carries (OteEstimationDetailsDto and the explanation next door) and
 * nothing in this file describes it. Everything under it is here: ten cards in
 * three bands, and a fifth band, Unlock more, where the frontend gathers every
 * locked card with the Barney door beside it.
 *
 * OWN USER ONLY. The route reads the person off the verified session, takes no
 * id, and answers a candidate about nobody but themselves. Nothing in this
 * response reaches a recruiter, and no recruiter route reuses these types.
 *
 * THE RUNDOWN NEVER GATES. A thin profile gets every card that computes, a
 * locked card for each one that a single field would unlock, and the field is
 * named on the card. Withholding the screen until a profile is perfect is how a
 * retention surface becomes one nobody comes back to.
 *
 * COMPUTED ON REQUEST. Nothing here is written to a column. Every card is built
 * from the person's roles, the pool and the rate card when asked for, so it
 * cannot go stale against the profile it describes and needs no migration.
 *
 * WHY IT LIVES HERE. The backend computes, the frontend formats, and this
 * package is a submodule in both, so a shape lands here first and both apps
 * compile against it before either fills it. Every name below is prefixed
 * RundownBenchmark so it cannot collide with the first Rundown's RundownCard
 * on either side.
 */

import type { Currency } from './ote-estimation-details.dto';

// =============================================================================
// LITERAL TYPES
// =============================================================================

/**
 * The ten cards. The number beside each is Victor's numbering from the brief,
 * kept because that is how the cards get talked about ("card 16").
 *
 * Victor picked these ten out of a longer list on 2026-09-09. The rest of that
 * list is backlog, and a new card is a new key here first.
 */
export type RundownBenchmarkCardKey =
  | 'bdr_to_closer' // 1
  | 'next_move' // 4
  | 'time_in_title' // 5
  | 'next_band' // 6
  | 'quota_percentile' // 7
  | 'deal_size_percentile' // 8
  | 'cycle_vs_segment' // 9
  | 'new_business_share' // 11
  | 'earn_vs_worth' // 16
  | 'open_roles'; // 19

/**
 * Which band of the page a card computes into.
 *
 * `standing` is band 2, Where you stand. `path` is band 3, Your path. `market`
 * is band 4, Your market. Band 1 is the estimate and is served elsewhere. Band
 * 5, Unlock more, is where the frontend gathers every `locked` card whatever
 * band it would have computed into, so no card carries it as a band.
 */
export type RundownBenchmarkBand = 'standing' | 'path' | 'market';

/**
 * `ready` carries a figure.
 *
 * `locked` means one field on this person's own profile would compute it, and
 * `unlock` names that field. This is the state the fifth band is made of.
 *
 * `not_applicable` means nothing they could enter would change the answer:
 * they never made the BDR to closer move, they hold a leadership role and we
 * do not price those, their city is outside USD and CAD, the estimate itself
 * was skipped, or the cohort still had fewer than 25 people at the widest
 * step. `detail.reason` says which. The frontend may hide such a card or give
 * it one quiet line; it never gets a lock icon, because there is nothing to
 * unlock.
 */
export type RundownBenchmarkState = 'ready' | 'locked' | 'not_applicable';

/**
 * Where the figure came from, so a card can say so.
 *
 * `your_numbers`: the person's own stored figures against each other, with no
 * cohort in it (what you earn against what your profile is worth).
 * `rate_card`: the estimator's own rate card and experience bands, priced on
 * today's card for the same role and tier. `pool`: medians and percentiles
 * over a cohort of other candidates, never means. `jobs`: published recruiter
 * projects.
 */
export type RundownBenchmarkSource = 'your_numbers' | 'rate_card' | 'pool' | 'jobs';

/**
 * Why a card is `not_applicable`, carried as `detail.reason` so both apps spell
 * it the same. Typed as a union here and stored as a string in `detail`, so a
 * new reason is a one-line addition rather than a shape change.
 *
 * `never_made_the_move`: bdr_to_closer for somebody with no booking role
 * followed by a closing role. `leadership_not_priced`: the money cards for
 * somebody in a leadership role, the same spelling as the OteSkipCode, so the
 * frontend renders Victor's leadership line once and keys it off one string.
 * `unsupported_country`: money cards outside USD and CAD. `no_estimate`: the
 * cards that need an estimate (next_band, earn_vs_worth) when the estimator
 * skipped for any other reason; band 1 already says why. `thin_cohort`: under
 * 25 people at the widest step. `no_current_title`: next_move and
 * time_in_title for somebody whose current title resolves to no family.
 */
export type RundownBenchmarkReason =
  | 'never_made_the_move'
  | 'leadership_not_priced'
  | 'unsupported_country'
  | 'no_estimate'
  | 'thin_cohort'
  | 'no_current_title';

// =============================================================================
// PARTS OF A CARD
// =============================================================================

/**
 * The people a pool card was measured against, named and counted.
 *
 * THE COHORT. Same role type (from the position_details flags: booking,
 * individual contributor, leadership), same dominant segment (the largest
 * share of SMB, mid-market and enterprise), same currency country (USD or
 * CAD), then narrowed by industry group and by city tier while 25 or more
 * people remain. When a step would drop it under 25 the step is skipped and
 * the label says so: "enterprise AEs paid in USD" rather than "enterprise
 * AEs in cybersecurity in a Tier 1 city". Medians, never means.
 *
 * THE SIZE IS ROUNDED DOWN BEFORE IT GETS HERE, and the frontend prints it as
 * "N plus". Below 100 to the nearest 25, below 500 to the nearest 50, above
 * that to the nearest 100: 312 arrives as 300 and the card reads "among 300
 * plus enterprise AEs paid in USD". Never under 25, because a cohort that
 * small never becomes a card at any widening step.
 *
 * THIS REVERSES A RULE THE FIRST RUNDOWN HAD. That surface let no count leave
 * the server, and the backend still carries tests that serialise GET /rundown
 * and grep the response for one. Victor's 2026-09-09 brief for these cards
 * names the cohort and its rounded size on the card itself, so this route
 * carries the count and those tests stay scoped to the old response. Anyone
 * extending that grep to this route is undoing a decision.
 */
export interface RundownBenchmarkCohortDto {
  /** Who was measured, as it reads on the card: "enterprise AEs paid in USD". */
  label: string;
  /** Already rounded down per the rule above. Never under 25. */
  size: number;
}

/**
 * The one field that turns a locked card into a figure.
 *
 * `field` is the answerable key the backend already whitelists for
 * POST /rundown/answer ('quotaAttainment', 'averageDealSize', 'currentOte',
 * 'segmentSplit', and whatever that whitelist grows to), so the inline answer
 * box and this card are naming the same thing. Without it the client would
 * infer the field from the wording, which is one copy edit away from writing
 * the wrong column.
 *
 * `label` is the ask, in Victor's voice: "Tell us what you earn today". Never
 * a promise of direction. An unlock that says "answer this and gain 10%" is an
 * instruction to lie, and the value of every number here rests on the inputs
 * being true.
 *
 * `barneyField` is the Barney field the door beside the card opens on, so the
 * conversation lands on the question rather than at the top. Null when Barney
 * has no field for it and the inline box is the only path.
 */
export interface RundownBenchmarkUnlockDto {
  field: string;
  label: string;
  barneyField: string | null;
}

/**
 * The raw figures behind the headline, for the frontend to format.
 *
 * A loose record on purpose: the ten cards carry ten different sets of
 * numbers and a typed shape per card would make every new figure a submodule
 * round trip. Both builders spell the keys from this table instead.
 *
 *   bdr_to_closer         months, median, delta (months; negative is faster)
 *   next_move             first, firstShare, second, secondShare, third,
 *                         thirdShare (title families and shares as 0..1)
 *   time_in_title         months (yours, so far), median, delta
 *   next_band             band, nextBand, monthsToNext, oteNow, oteNext, delta
 *   quota_percentile      value (attainment as a %), median, percentile
 *   deal_size_percentile  value, median, percentile
 *   cycle_vs_segment      value (days), median, delta (days; negative is shorter)
 *   new_business_share    value (0..1), median, delta
 *   earn_vs_worth         currentOte, estimate, low, high, delta
 *                         (currentOte minus estimate)
 *   open_roles            count, low, high (the OTE range recruiters posted),
 *                         titleFamily, segment
 *
 * `percentile` runs 0 to 100 and higher is better, so "top 18%" is percentile
 * 82. Money is in the response's `currency`, in whole units. The four cards
 * that read one role (quota, deal size, cycle, new business) also carry
 * `positionId`, `role` and `company` so the card can say which role it read.
 * A card that is not `ready` may carry `reason` (see RundownBenchmarkReason).
 * `detail` is never empty on a `ready` card and may be `{}` on the others.
 */
export type RundownBenchmarkDetail = Record<string, string | number | null>;

// =============================================================================
// THE CARD
// =============================================================================

export interface RundownBenchmarkCardDto {
  key: RundownBenchmarkCardKey;
  band: RundownBenchmarkBand;
  state: RundownBenchmarkState;
  /**
   * The big figure as text: "3.5 years", "top 18%", "None right now". On a
   * `locked` card, the short name of what they would learn ("Your quota rank").
   * On a `not_applicable` card, the one line that says so.
   */
  headline: string;
  /**
   * What a bare-number headline is in ("months", "%"), for surfaces that set
   * the unit small beside the figure. Null when the headline carries its own
   * words, which is most of them.
   */
  unit: string | null;
  /**
   * One sentence. Names the cohort when there is one, says median and never
   * average, and puts the person's figure before the pool's: "AEs typically
   * move after 2.8 years; you are at 3.5." On a `locked` card, what the
   * figure would tell them, with no promise of which way it goes.
   */
  claim: string;
  /**
   * Set on `ready` cards whose `source` is 'pool'. Null everywhere else,
   * including locked pool cards, because a cohort nobody was measured against
   * is a number with nothing behind it.
   */
  cohort: RundownBenchmarkCohortDto | null;
  source: RundownBenchmarkSource;
  /** Set on `locked` cards and null on the other two states. */
  unlock: RundownBenchmarkUnlockDto | null;
  detail: RundownBenchmarkDetail;
}

/**
 * Where each card computes into and what it is built from, in one place, so
 * the backend stamps `band` and `source` from here and the frontend lays the
 * bands out from here, and a card cannot sit in one band on the server and
 * another on the screen.
 */
export interface RundownBenchmarkCardSpec {
  band: RundownBenchmarkBand;
  source: RundownBenchmarkSource;
  /** Victor's number for the card in the 2026-09-08 brief. */
  brief: number;
}

export const RUNDOWN_BENCHMARK_CARD_SPEC: Record<
  RundownBenchmarkCardKey,
  RundownBenchmarkCardSpec
> = {
  quota_percentile: { band: 'standing', source: 'pool', brief: 7 },
  deal_size_percentile: { band: 'standing', source: 'pool', brief: 8 },
  cycle_vs_segment: { band: 'standing', source: 'pool', brief: 9 },
  new_business_share: { band: 'standing', source: 'pool', brief: 11 },
  earn_vs_worth: { band: 'standing', source: 'your_numbers', brief: 16 },
  bdr_to_closer: { band: 'path', source: 'pool', brief: 1 },
  next_move: { band: 'path', source: 'pool', brief: 4 },
  time_in_title: { band: 'path', source: 'pool', brief: 5 },
  next_band: { band: 'path', source: 'rate_card', brief: 6 },
  open_roles: { band: 'market', source: 'jobs', brief: 19 },
};

/**
 * The order the cards appear on the page, top to bottom, which is also the
 * order the backend returns them in. Victor set it on 2026-09-09: Where you
 * stand runs 7, 8, 9, 11 then 16; Your path runs 1, 4, 5, 6; Your market is
 * 19. A locked card keeps its place in this order when the frontend gathers
 * the locked ones under Unlock more.
 */
export const RUNDOWN_BENCHMARK_CARD_ORDER = [
  'quota_percentile',
  'deal_size_percentile',
  'cycle_vs_segment',
  'new_business_share',
  'earn_vs_worth',
  'bdr_to_closer',
  'next_move',
  'time_in_title',
  'next_band',
  'open_roles',
] as const;

// =============================================================================
// THE RESPONSE
// =============================================================================

/**
 * The body of GET /rundown/benchmarks.
 */
export interface RundownBenchmarksDto {
  /** ISO 8601. Computed on request, so this is the time of the request. */
  generatedAt: string;
  /**
   * The currency every money figure in `cards` is in, resolved from the
   * person's city the way the estimator resolves it. Null when the city is
   * outside the United States and Canada, in which case every money card is
   * `not_applicable` with reason 'unsupported_country' and the pool cards
   * that need no money still compute.
   */
  currency: Currency | null;
  /**
   * ALL TEN, ALWAYS, one card per key, in RUNDOWN_BENCHMARK_CARD_ORDER. A card
   * that cannot compute arrives as `locked` or `not_applicable` rather than
   * going missing, so the frontend never has to ask whether a key was left out
   * or merely could not be answered.
   */
  cards: RundownBenchmarkCardDto[];
}
