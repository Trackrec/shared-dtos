/**
 * COMPILE-TIME ASSERTIONS FOR THE RUNDOWN BENCHMARKS CONTRACT. No runtime, no
 * runner: `tsc --noEmit` is the test, and a failing assertion is a type error
 * on the line that names it.
 *
 * WHAT THIS GUARDS. Two builders code against this file in two repos that move
 * the submodule pointer in separate merge commits. The tickets spell the
 * twenty-six keys, the four bands, the three states, the eleven reasons, the
 * three confidence levels, the page order and the card's property set, and a
 * later edit that renamed one would compile fine here and break one app at its
 * next build with no test of its own to say why. These lines say why.
 */
import type { OteSkipCode } from '../ote-estimation-details.dto';
import type {
  RundownBenchmarkBand,
  RundownBenchmarkCardDto,
  RundownBenchmarkCardKey,
  RundownBenchmarkCohortDto,
  RundownBenchmarkConfidence,
  RundownBenchmarkDetail,
  RundownBenchmarkDetailBand,
  RundownBenchmarkDetailRole,
  RundownBenchmarkDetailValue,
  RundownBenchmarkReason,
  RundownBenchmarkSource,
  RundownBenchmarkState,
  RundownBenchmarksDto,
  RundownBenchmarkUnlockDto,
} from '../rundown-benchmarks.dto';
import {
  RUNDOWN_BENCHMARK_CARD_ORDER,
  RUNDOWN_BENCHMARK_CARD_SPEC,
} from '../rundown-benchmarks.dto';

type Assert<T extends true> = T;

/** True when A and B accept exactly the same values. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// 1. Exactly the twenty-six keys, spelled as the tickets spell them: the
//    eighteen of the 2026-09-09 cut, the four fork cards added the same day,
//    and the four insight cards of the bold page (2026-09-10).
export type TwentySixKeys = Assert<
  Same<
    RundownBenchmarkCardKey,
    | 'bdr_to_closer'
    | 'closer_to_enterprise'
    | 'time_to_leadership'
    | 'next_move'
    | 'time_in_title'
    | 'time_per_role'
    | 'years_selling'
    | 'next_band'
    | 'quota_percentile'
    | 'deal_size_percentile'
    | 'cycle_vs_segment'
    | 'revenue_per_year'
    | 'new_business_share'
    | 'outbound_share'
    | 'city_premium'
    | 'earn_vs_worth'
    | 'ask_vs_offers'
    | 'open_roles'
    | 'fork_so_far'
    | 'fork_timing'
    | 'leaders_return'
    | 'title_ladder'
    | 'largest_deal_ratio'
    | 'deal_after_move'
    | 'quota_record'
    | 'buyer_reach'
  >
>;

// 2. The four bands (insight is the Did you know band of 2026-09-10), the
//    three states and the four sources.
export type FourBands = Assert<
  Same<RundownBenchmarkBand, 'standing' | 'path' | 'insight' | 'market'>
>;
export type ThreeStates = Assert<
  Same<RundownBenchmarkState, 'ready' | 'locked' | 'not_applicable'>
>;
export type FourSources = Assert<
  Same<RundownBenchmarkSource, 'your_numbers' | 'rate_card' | 'pool' | 'jobs'>
>;
// The three confidence levels, spelled as the 2026-09-09 rule spells them. A
// fourth level, or a number in their place, breaks the footer in both apps.
export type ThreeConfidenceLevels = Assert<
  Same<RundownBenchmarkConfidence, 'high' | 'medium' | 'low'>
>;

// 3. The card's property set is the tickets', no more and no less. didYouKnow
//    is the bold page's band: a card without the property is a card the
//    frontend cannot print a fact on, and a card with a second one is two bands.
export type CardHasTheTicketsKeys = Assert<
  Same<
    keyof RundownBenchmarkCardDto,
    | 'key'
    | 'band'
    | 'state'
    | 'title'
    | 'headline'
    | 'unit'
    | 'claim'
    | 'short'
    | 'didYouKnow'
    | 'cohort'
    | 'source'
    | 'unlock'
    | 'detail'
  >
>;

// 4. So is the response's.
export type ResponseHasTheTicketsKeys = Assert<
  Same<keyof RundownBenchmarksDto, 'generatedAt' | 'currency' | 'cards'>
>;
export type CardsAreCards = Assert<Same<RundownBenchmarksDto['cards'], RundownBenchmarkCardDto[]>>;

// 5. The parts. This pins the property sets and the base types. It cannot pin
//    a `| null`: this package, and both apps, compile with strictNullChecks
//    off, where `string | null` and `string` are one type. The null-ness in the
//    doc comments is documentation, and these lines are not evidence for it.
//    The cohort carries what the card prints (`who`, `confidence`) and what
//    only the admin report reads (`label`, `size`). All four, spelled so.
export type CohortShape = Assert<
  Same<
    RundownBenchmarkCohortDto,
    { who: string; confidence: RundownBenchmarkConfidence; label: string; size: number }
  >
>;
// The unlock names the role the answer is written to. deal_after_move asks
// for the earlier of two roles the card read, so the id can no longer be
// inferred from the detail, and a client that reads it from the wrong place
// writes the wrong role.
export type UnlockShape = Assert<
  Same<
    RundownBenchmarkUnlockDto,
    { field: string; label: string; barneyField: string | null; positionId: number | null }
  >
>;
// The detail stays a loose record. Its non-scalar values are two lists: the
// bands fork_timing draws its distribution from, and the roles quota_record
// draws one bar each for. A third array type, or an object in a value's place,
// is a shape change both apps have to see.
export type DetailIsALooseRecord = Assert<
  Same<RundownBenchmarkDetail, Record<string, RundownBenchmarkDetailValue>>
>;
export type DetailValueIsScalarOrOneOfTwoLists = Assert<
  Same<
    RundownBenchmarkDetailValue,
    string | number | null | RundownBenchmarkDetailBand[] | RundownBenchmarkDetailRole[]
  >
>;
export type BandShape = Assert<
  Same<
    RundownBenchmarkDetailBand,
    { label: string; fromYears: number; toYears: number | null; share: number }
  >
>;
export type RoleShape = Assert<
  Same<
    RundownBenchmarkDetailRole,
    { positionId: number; role: string; company: string; value: number }
  >
>;
export type CohortIsTheCohort = Assert<
  Same<NonNullable<RundownBenchmarkCardDto['cohort']>, RundownBenchmarkCohortDto>
>;
export type UnlockIsTheUnlock = Assert<
  Same<NonNullable<RundownBenchmarkCardDto['unlock']>, RundownBenchmarkUnlockDto>
>;
export type DidYouKnowIsOneSentenceOrNothing = Assert<
  Same<RundownBenchmarkCardDto['didYouKnow'], string | null>
>;

// 6. The spec table and the page order each cover every key and nothing else,
//    so a card cannot exist without a band and a source, and cannot be left
//    off the page.
export type SpecCoversEveryKey = Assert<
  Same<keyof typeof RUNDOWN_BENCHMARK_CARD_SPEC, RundownBenchmarkCardKey>
>;
export type OrderCoversEveryKey = Assert<
  Same<(typeof RUNDOWN_BENCHMARK_CARD_ORDER)[number], RundownBenchmarkCardKey>
>;
type Length<T extends readonly unknown[]> = T['length'];
export type OrderListsEachKeyOnce = Assert<Same<Length<typeof RUNDOWN_BENCHMARK_CARD_ORDER>, 26>>;

// 6b. The page order is the one Victor set, card by card: the three fork cards
//     right after time_to_leadership, the title ladder after years_selling and
//     before next_band, the four insight cards after the path cards and before
//     the market. The backend returns in this order and the frontend lays out
//     in it, so a card moved on one side alone is a card in two places.
export type OrderIsTheTicketsOrder = Assert<
  Same<
    typeof RUNDOWN_BENCHMARK_CARD_ORDER,
    readonly [
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
      'largest_deal_ratio',
      'deal_after_move',
      'quota_record',
      'buyer_reach',
      'city_premium',
      'ask_vs_offers',
      'open_roles',
    ]
  >
>;

// 7. Leaders skip the salary part. The estimator has a code for it, spelled
//    the way the Rundown's own reason spells it.
export type LeadershipIsASkipCode = Assert<
  'leadership_not_priced' extends OteSkipCode ? true : false
>;

// 8. The eleven reasons: no_ask so the card a declined ask lands on has one
//    spelling in both apps; too_early so the fork card a seller under three
//    years sees is one card and not a lock with no field; folded_into_band_1
//    so the pay card an old client still lays out reads as one quiet line;
//    no_buyer_list so the buyer card's ask state is keyed off one string; and
//    top_band, which the backend has emitted since the ladder shipped, listed
//    so the contract spells what the wire carries.
export type ElevenReasons = Assert<
  Same<
    RundownBenchmarkReason,
    | 'never_made_the_move'
    | 'leadership_not_priced'
    | 'unsupported_country'
    | 'no_estimate'
    | 'thin_cohort'
    | 'no_current_title'
    | 'no_ask'
    | 'too_early'
    | 'folded_into_band_1'
    | 'no_buyer_list'
    | 'top_band'
  >
>;
