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
 * nothing in this file describes it. Everything under it is here: twenty-two
 * cards in three bands, and a fifth band, Unlock more, where the frontend
 * gathers every locked card with the Barney door beside it.
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
 * CONFIDENCE, NOT COUNTS. Victor, 2026-09-09, reading a card that said "Among
 * 200 plus account executives in mid-market paid in USD, widened from your
 * industry because too few people match you closely": "I don't want to give
 * precise numbers. I want to give a level of confidence." So a pool card names
 * the people it was measured against in words and gives one of three levels.
 * High: no axis dropped and 100 or more people. Medium: one axis dropped, or
 * 50 to 99 people. Low: two or more axes dropped, or 25 to 49 people. Under 25
 * the card stays locked or not_applicable, as before. No card text says how
 * many people were compared and no card text says the comparison was widened.
 * The count and the widening live in the admin report, and nowhere a
 * candidate can see.
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
 * The twenty-two cards. The number beside each is Victor's numbering from the
 * brief, kept because that is how the cards get talked about ("card 16").
 *
 * Victor picked ten of these out of the 22 on the 2026-09-08 list on
 * 2026-09-09, then widened the cut to eighteen the same day. Two of the eight
 * he added, time_per_role and years_selling, were not on that list and take
 * the next two numbers so they can be talked about the same way. The rest of
 * the list is backlog, and a new card is a new key here first.
 *
 * THE FORK CARDS, 25 to 28, came later the same day out of the fork research
 * (MY-MARKET-FORK-RESEARCH-2026-09-09.md) and Victor's rule for them: "ok
 * don't make up anything just stick to the data." Each one is computed from
 * the pool with that document's definitions (accounts with role Applicant,
 * active positions with a start year, a missing end counts as current, role
 * type from the position flags, US and CA by city falling back to currency,
 * month index = year * 12 + month, medians, nothing under 25 shown) and its
 * numbers are checked against that document's tables. No fork card infers a
 * cause, a trait or a forecast; the frame on every one is what happened to
 * people who started where you did. The How we got here of each fork card,
 * and of the leadership fork inside next_move, carries these three limits in
 * plain words and with no numbers beyond the card's own: "Everyone here is
 * still in or near sales, so people who left are not counted." "The
 * leadership flag treats a manager of two like a VP over two hundred." "This
 * is what happened to people who started where you did, not a forecast."
 *
 * fork_so_far, "Your fork so far": for a person whose first dated sales role
 * was closing or booking, at the largest of the 3, 5, 8 and 10 year marks they
 * have reached since their first closing role, the share of sellers who
 * started the same way and reached that mark who had held a leadership role
 * by it, the share still an individual contributor who never led, and the
 * rest. fork_timing, "When the move happens": among people who moved into
 * leadership within ten years of their first closing role, the share who did
 * it within 2, 5 and 8 years, the median years, and where a mover's own gap
 * sits. leaders_return, "The door swings both ways": among people who have
 * held a leadership role, the share who held an individual contributor role
 * again afterwards, the share in an IC seat today, and the median years from
 * the first leadership role to the return. title_ladder, "Title ladder pace":
 * from the first plain Account Executive title (no Senior, Sr, Enterprise or
 * Strategic), the median months to a Senior AE title, to an Enterprise or
 * Strategic AE title and to a leadership role, and the share of AEs with
 * eight or more years behind them who reached each within eight years. The
 * fifth card the research supports, where leaders go next, is the leadership
 * fork inside next_move and is not a key of its own.
 */
export type RundownBenchmarkCardKey =
  | 'bdr_to_closer' // 1
  | 'closer_to_enterprise' // 2
  | 'time_to_leadership' // 3
  | 'next_move' // 4
  | 'time_in_title' // 5
  | 'next_band' // 6
  | 'quota_percentile' // 7
  | 'deal_size_percentile' // 8
  | 'cycle_vs_segment' // 9
  | 'revenue_per_year' // 10
  | 'new_business_share' // 11
  | 'outbound_share' // 12
  | 'city_premium' // 15
  | 'earn_vs_worth' // 16
  | 'ask_vs_offers' // 17
  | 'open_roles' // 19
  | 'time_per_role' // 23
  | 'years_selling' // 24
  | 'fork_so_far' // 25
  | 'fork_timing' // 26
  | 'leaders_return' // 27
  | 'title_ladder'; // 28

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
 * How closely the cohort matches the person, in one word the card can print.
 *
 * The backend sets it from two things pickCohort knows and the card does not
 * say: how many axes it dropped to reach 25 people, and how many people were
 * left. The rule is in the header. `high` is a close match with enough people
 * behind it. `medium` is one step wider, or a close match with fewer people.
 * `low` is two steps wider, or a small cohort, and reads as a direction
 * rather than a measure.
 *
 * The frontend prints the word with a three bar mark, in ink, and explains the
 * level in one sentence with no number in it. The level is never a colour for
 * good or bad, because a low confidence is a fact about the pool and says
 * nothing about the person.
 */
export type RundownBenchmarkConfidence = 'high' | 'medium' | 'low';

/**
 * Why a card is `not_applicable`, carried as `detail.reason` so both apps spell
 * it the same. Typed as a union here and stored as a string in `detail`, so a
 * new reason is a one-line addition rather than a shape change.
 *
 * `never_made_the_move`: bdr_to_closer for somebody with no booking role
 * followed by a closing role, closer_to_enterprise for somebody who never held
 * an enterprise role, time_to_leadership and leaders_return for somebody who
 * never led, fork_so_far for somebody who started in leadership ("You started
 * in leadership, so there is no fork to measure from a closing seat."),
 * title_ladder for somebody with no plain Account Executive title on file
 * ("This ladder starts at an Account Executive title, which is not on your
 * profile."). `too_early`: fork_so_far for somebody under three years from
 * their first closing role. The card is locked on time and only time lifts it,
 * so it is not a `locked` card (a lock names a field to answer) and the
 * headline says when to come back: "Come back after three years in a closing
 * role". `leadership_not_priced`: the money cards for somebody in a leadership role,
 * the same spelling as the OteSkipCode, so the frontend renders Victor's
 * leadership line once and keys it off one string. `unsupported_country`:
 * money cards outside USD and CAD. `no_estimate`: the cards that need an
 * estimate (next_band, earn_vs_worth, city_premium) when the estimator skipped
 * for any other reason; band 1 already says why. `thin_cohort`: under 25
 * people at the widest step. `no_current_title`: next_move and time_in_title
 * for somebody whose current title resolves to no family. `no_ask`:
 * ask_vs_offers for somebody with no ask on file. The ask is the one question
 * the Rundown lets a person decline, so a missing one is never a lock: a lock
 * would name the field and ask again.
 */
export type RundownBenchmarkReason =
  | 'never_made_the_move'
  | 'leadership_not_priced'
  | 'unsupported_country'
  | 'no_estimate'
  | 'thin_cohort'
  | 'no_current_title'
  | 'no_ask'
  | 'too_early';

// =============================================================================
// PARTS OF A CARD
// =============================================================================

/**
 * The people a pool card was measured against, in words, with a level of
 * confidence.
 *
 * THE COHORT. Same role type (from the position_details flags: booking,
 * individual contributor, leadership), same dominant segment (the largest
 * share of SMB, mid-market and enterprise), same currency country (USD or
 * CAD), then narrowed by industry group and by city tier while 25 or more
 * people remain. When a step would drop it under 25 the step is skipped and
 * the confidence comes down a level. Medians, never means.
 *
 * `who` IS WHAT THE CARD PRINTS. The people compared, in words, with no size
 * and no widening clause: "account executives in mid-market paid in USD". The
 * frontend sets it after "Against" in the card footer, so it has to read as a
 * plain noun phrase. The 200 plus and the "widened from your industry because
 * too few people match you closely" that used to follow it are gone from every
 * card string, `claim` and `short` included.
 *
 * `confidence` IS THE ONE MEASURE OF THE COHORT A CANDIDATE SEES. High, medium
 * or low, per the rule in the header. The frontend prints the word and one
 * sentence that explains it without a number.
 *
 * `label` AND `size` STAY FOR THE ADMIN REPORT ONLY. benchmark-report.js still
 * prints the cohort as it was named at the widest step ("enterprise AEs paid
 * in USD") and how many people it held, rounded down as before: below 100 to
 * the nearest 25, below 500 to the nearest 50, above that to the nearest 100,
 * never under 25. The frontend does not read either field, and no frontend
 * surface prints them. A card, a footer, a disclosure or a share line that
 * shows a count is undoing Victor's 2026-09-09 decision.
 *
 * THE COUNT STILL TRAVELS. The first Rundown let no count leave the server,
 * and the backend carries tests that serialise GET /rundown and grep the
 * response for one. This route carries `size` for the report, so those tests
 * stay scoped to the old response. The line that moved is the screen: the
 * frontend's own test asserts that no rendered card text has a digit followed
 * by "plus" or the word "widened".
 */
export interface RundownBenchmarkCohortDto {
  /**
   * The people compared, as the card prints them after "Against": "account
   * executives in mid-market paid in USD". No size, no widening clause.
   */
  who: string;
  /** How closely they match the person. The rule is in the header. */
  confidence: RundownBenchmarkConfidence;
  /**
   * Admin report only. The cohort as it was named at the widest step, with
   * the steps it skipped: "enterprise AEs paid in USD". The frontend does not
   * read it.
   */
  label: string;
  /**
   * Admin report only. Rounded down per the rule above, never under 25. The
   * frontend does not read it, and no frontend surface prints it.
   */
  size: number;
}

/**
 * The one field that turns a locked card into a figure.
 *
 * `field` is the answerable key the backend whitelists for
 * POST /rundown/answer ('quotaAttainment', 'averageDealSize', 'currentOte',
 * 'segmentSplit', 'averageSalesCycle', 'newBusiness', and whatever that
 * whitelist grows to), so the inline answer box and this card are naming the
 * same thing. Without it the client would infer the field from the wording,
 * which is one copy edit away from writing the wrong column.
 *
 * `field` IS NULL WHEN ONLY BARNEY CAN TAKE THE ANSWER. A start date or a
 * whole role is not a number the inline box accepts and is not on that
 * whitelist, so the card carries no field and the client shows the Barney
 * door alone. The rule: a non-null `field` is always a key the route accepts,
 * and a key the route does not accept is never sent as a string, because the
 * client would offer a box the route then refuses. At least one of `field`
 * and `barneyField` is set on every locked card.
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
  field: string | null;
  label: string;
  barneyField: string | null;
}

/**
 * One bar of a distribution a card draws. Today only fork_timing carries one,
 * under `bands`: the gap from the first closing role to the first leadership
 * role, in the six bands the fork research reported (under 1, 1 to 2, 2 to 3,
 * 3 to 5, 5 to 8, 8 to 10 years). `label` is the words the bar is labelled
 * with ("under 1", "1 to 2"). `fromYears` is inclusive and `toYears`
 * exclusive, so a gap of exactly two years sits in 2 to 3; `toYears` is null
 * only on a band with no top, and none of fork_timing's is. `share` runs 0 to
 * 1 over the movers, and the shares of one card's bands sum to 1. A band
 * carries no count, per the confidence rule; the frontend marks the person's
 * own band from the card's `personYears`.
 */
export interface RundownBenchmarkDetailBand {
  label: string;
  fromYears: number;
  toYears: number | null;
  share: number;
}

/**
 * The raw figures behind the headline, for the frontend to format.
 *
 * A loose record on purpose: the twenty-two cards carry twenty-two different
 * sets of numbers and a typed shape per card would make every new figure a
 * submodule round trip. Both builders spell the keys from this table instead.
 *
 *   bdr_to_closer         months, median, delta (months; negative is faster)
 *   closer_to_enterprise  months (first closing role to first enterprise
 *                         role), median, delta
 *   time_to_leadership    months (first role to first leadership role),
 *                         median, delta
 *   next_move             first, firstShare, second, secondShare, third,
 *                         thirdShare (title families and shares as 0..1)
 *   time_in_title         months (yours, so far), median, delta
 *   time_per_role         months (your median across your roles), median (the
 *                         pool's), delta, roles (how many of yours were read)
 *   years_selling         years (yours, one decimal), median, delta
 *   next_band             band, nextBand, monthsToNext, oteNow, oteNext, delta
 *   quota_percentile      value (attainment as a %), median, percentile
 *   deal_size_percentile  value, median, percentile
 *   cycle_vs_segment      value (days), median, delta (days; negative is shorter)
 *   revenue_per_year      value (revenue per year in role), median, percentile
 *   new_business_share    value (0..1), median, delta
 *   outbound_share        value (0..1), median, delta, worth (the outbound
 *                         modifier on today's card, in money; null when the
 *                         split does not earn it. The one rate card figure on
 *                         a pool card, and the card says where it came from)
 *   city_premium          tier, multiplier, baseline (the Tier3 row), value
 *                         (after the tier), delta (value minus baseline;
 *                         negative where the city pays under it), city
 *   earn_vs_worth         currentOte, estimate, low, high, delta
 *                         (currentOte minus estimate)
 *   ask_vs_offers         ask, median (what recruiters posted for the role
 *                         you want), low, high, count (jobs read), delta (ask
 *                         minus median), titleFamily
 *   open_roles            count, low, high (the OTE range recruiters posted),
 *                         titleFamily, segment
 *   fork_so_far           markYears (3, 5, 8 or 10: the largest mark the
 *                         person has reached since their first closing role),
 *                         eligible (sellers who started in a closing or booking
 *                         seat and have reached that mark; the cohort floor of
 *                         25 applies to it, the admin report reads it and no
 *                         card prints it), ledShare (held a leadership role by
 *                         the mark), stillIcShare (in an IC seat at the mark
 *                         and never led), restShare (booking, another titled
 *                         role, or no dated role covering the mark; the three
 *                         shares sum to 1), personState ('led' | 'stillIc' |
 *                         'other')
 *   fork_timing           medianYears (first closing role to first leadership
 *                         role, over movers within ten years), within2Share,
 *                         within5Share, within8Share (movers who made the move
 *                         inside that many years), personYears (the person's
 *                         own gap in years; null when they have not moved),
 *                         bands (RundownBenchmarkDetailBand[], the six bands
 *                         of the gap with their shares)
 *   leaders_return        returnedShare (leaders who held an IC role at any
 *                         point after their first leadership role),
 *                         icTodayShare (leaders in an IC seat today with no
 *                         open leadership role), medianYearsToReturn (first
 *                         leadership role start to the IC role start),
 *                         personYearsLeading (years since the person's first
 *                         leadership role started), personReturnedAfterYears
 *                         (years from their first leadership role to their
 *                         return to an IC role; null until they have)
 *   title_ladder          seniorMedianMonths, enterpriseMedianMonths,
 *                         leadershipMedianMonths (from the first plain Account
 *                         Executive title, medians over everyone who reached
 *                         the step), seniorWithin8Share, enterpriseWithin8Share,
 *                         leadershipWithin8Share (AEs whose anchor is eight or
 *                         more years old who reached the step inside eight
 *                         years), personSeniorMonths, personEnterpriseMonths,
 *                         personLeadershipMonths (the person's own months from
 *                         their anchor to each step; null for a step not taken)
 *
 * `percentile` runs 0 to 100 and higher is better, so "top 18%" is percentile
 * 82. Every `Share` runs 0 to 1, as on next_move. Money is in the response's
 * `currency`, in whole units. The six cards that read one role (quota, deal
 * size, cycle, revenue, new business, outbound) also carry `positionId`,
 * `role` and `company` so the card can say which role it read.
 * A card that is not `ready` may carry `reason` (see RundownBenchmarkReason).
 * `detail` is never empty on a `ready` card and may be `{}` on the others.
 *
 * Every value is a string, a number or null, except the one distribution:
 * `bands` on fork_timing is an array of RundownBenchmarkDetailBand. Both apps
 * read a detail value through a `typeof` check, so the array is invisible to
 * every reader that does not ask for it.
 */
export type RundownBenchmarkDetailValue = string | number | null | RundownBenchmarkDetailBand[];

export type RundownBenchmarkDetail = Record<string, RundownBenchmarkDetailValue>;

// =============================================================================
// THE CARD
// =============================================================================

export interface RundownBenchmarkCardDto {
  key: RundownBenchmarkCardKey;
  band: RundownBenchmarkBand;
  state: RundownBenchmarkState;
  /**
   * The bold card title, the same words in every state: "Time to closing",
   * "Your quota rank", "What your city adds". Two to four words and never a
   * figure, so the figure has one place to be, `headline`. Set here so both
   * apps print one name for one card and a copy edit lands in one file.
   */
  title: string;
  /**
   * The big figure as text: "3.5 years", "top 18%", "None right now". On a
   * `locked` card, the short name of what they would learn ("Your quota rank"),
   * which may repeat `title`. On a `not_applicable` card, the one line that
   * says so.
   */
  headline: string;
  /**
   * What a bare-number headline is in ("months", "%"), for surfaces that set
   * the unit small beside the figure. Null when the headline carries its own
   * words, which is most of them.
   */
  unit: string | null;
  /**
   * One sentence. May name the people in the words of `who`, says median and
   * never average, and puts the person's figure before the pool's: "AEs
   * typically move after 2.8 years; you are at 3.5." It carries no cohort
   * size and no widening clause; the footer says who and how confident from
   * `cohort`. On a `locked` card, what the figure would tell them, with no
   * promise of which way it goes.
   */
  claim: string;
  /**
   * One sentence of at most 90 characters: the person's number and the
   * comparison, and no cohort. "You closed 118% of quota; the median is 96%."
   * "You are at 3.5 years; AEs move after a median 2.8." Where `claim` names
   * the people and runs long, `short` fits a tight card or a share line, and
   * the frontend never trims `claim` to make one. Medians, never averages, and
   * money as the app prints it ("CAD$ 42,000"). On a `locked` card, what the
   * figure would tell them in the same length, with no promise of which way
   * it goes.
   */
  short: string;
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
 *
 * city_premium is priced on the card rather than measured over the pool. The
 * tier step is the figure band 1 already applies to this person, so the two
 * can never disagree, and it needs no cohort of 25 to compute.
 */
export interface RundownBenchmarkCardSpec {
  band: RundownBenchmarkBand;
  source: RundownBenchmarkSource;
  /**
   * Victor's number for the card in the 2026-09-08 brief, or the next number
   * after that list for a card added since (23 and 24 on 2026-09-09, then 25
   * to 28 for the fork cards the same day).
   */
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
  revenue_per_year: { band: 'standing', source: 'pool', brief: 10 },
  outbound_share: { band: 'standing', source: 'pool', brief: 12 },
  earn_vs_worth: { band: 'standing', source: 'your_numbers', brief: 16 },
  bdr_to_closer: { band: 'path', source: 'pool', brief: 1 },
  closer_to_enterprise: { band: 'path', source: 'pool', brief: 2 },
  time_to_leadership: { band: 'path', source: 'pool', brief: 3 },
  fork_so_far: { band: 'path', source: 'pool', brief: 25 },
  fork_timing: { band: 'path', source: 'pool', brief: 26 },
  leaders_return: { band: 'path', source: 'pool', brief: 27 },
  next_move: { band: 'path', source: 'pool', brief: 4 },
  time_in_title: { band: 'path', source: 'pool', brief: 5 },
  time_per_role: { band: 'path', source: 'pool', brief: 23 },
  years_selling: { band: 'path', source: 'pool', brief: 24 },
  title_ladder: { band: 'path', source: 'pool', brief: 28 },
  next_band: { band: 'path', source: 'rate_card', brief: 6 },
  city_premium: { band: 'market', source: 'rate_card', brief: 15 },
  ask_vs_offers: { band: 'market', source: 'jobs', brief: 17 },
  open_roles: { band: 'market', source: 'jobs', brief: 19 },
};

/**
 * The order the cards appear on the page, top to bottom, which is also the
 * order the backend returns them in. Victor set it on 2026-09-09: Where you
 * stand runs 7, 8, 9, 11, 10, 12 then 16; Your path runs 1, 2, 3, then the
 * three fork cards 25, 26, 27, then 4, 5, 23, 24, the title ladder 28, then 6;
 * Your market runs 15, 17 then 19. The fork cards sit right after time to
 * leadership because they answer the question that card raises, and the title
 * ladder sits with the other title cards before the band card. A locked card
 * keeps its place in this order when the frontend gathers the locked ones
 * under Unlock more.
 */
export const RUNDOWN_BENCHMARK_CARD_ORDER = [
  'quota_percentile',
  'deal_size_percentile',
  'cycle_vs_segment',
  'new_business_share',
  'revenue_per_year',
  'outbound_share',
  'earn_vs_worth',
  'bdr_to_closer',
  'closer_to_enterprise',
  'time_to_leadership',
  'fork_so_far',
  'fork_timing',
  'leaders_return',
  'next_move',
  'time_in_title',
  'time_per_role',
  'years_selling',
  'title_ladder',
  'next_band',
  'city_premium',
  'ask_vs_offers',
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
   * ALL TWENTY-TWO, ALWAYS, one card per key, in RUNDOWN_BENCHMARK_CARD_ORDER. A
   * card that cannot compute arrives as `locked` or `not_applicable` rather
   * than going missing, so the frontend never has to ask whether a key was
   * left out or merely could not be answered.
   */
  cards: RundownBenchmarkCardDto[];
}
