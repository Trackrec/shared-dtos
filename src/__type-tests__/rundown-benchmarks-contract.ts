/**
 * COMPILE-TIME ASSERTIONS FOR THE RUNDOWN BENCHMARKS CONTRACT. No runtime, no
 * runner: `tsc --noEmit` is the test, and a failing assertion is a type error
 * on the line that names it.
 *
 * WHAT THIS GUARDS. Two builders code against this file in two repos that move
 * the submodule pointer in separate merge commits. The ticket spells the
 * eighteen keys, the three bands, the three states, the seven reasons and the
 * card's property set, and a later edit that renamed one would compile fine
 * here and break one app at its next build with no test of its own to say
 * why. These lines say why.
 */
import type { OteSkipCode } from '../ote-estimation-details.dto';
import type {
  RundownBenchmarkBand,
  RundownBenchmarkCardDto,
  RundownBenchmarkCardKey,
  RundownBenchmarkCohortDto,
  RundownBenchmarkDetail,
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

// 1. Exactly the eighteen keys, spelled as the ticket spells them.
export type EighteenKeys = Assert<
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
  >
>;

// 2. The three bands, the three states and the four sources.
export type ThreeBands = Assert<Same<RundownBenchmarkBand, 'standing' | 'path' | 'market'>>;
export type ThreeStates = Assert<
  Same<RundownBenchmarkState, 'ready' | 'locked' | 'not_applicable'>
>;
export type FourSources = Assert<
  Same<RundownBenchmarkSource, 'your_numbers' | 'rate_card' | 'pool' | 'jobs'>
>;

// 3. The card's property set is the ticket's, no more and no less.
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
export type CohortShape = Assert<Same<RundownBenchmarkCohortDto, { label: string; size: number }>>;
export type UnlockShape = Assert<
  Same<RundownBenchmarkUnlockDto, { field: string; label: string; barneyField: string | null }>
>;
export type DetailIsALooseRecord = Assert<
  Same<RundownBenchmarkDetail, Record<string, string | number | null>>
>;
export type CohortIsTheCohort = Assert<
  Same<NonNullable<RundownBenchmarkCardDto['cohort']>, RundownBenchmarkCohortDto>
>;
export type UnlockIsTheUnlock = Assert<
  Same<NonNullable<RundownBenchmarkCardDto['unlock']>, RundownBenchmarkUnlockDto>
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
export type OrderListsEachKeyOnce = Assert<Same<Length<typeof RUNDOWN_BENCHMARK_CARD_ORDER>, 18>>;

// 7. Leaders skip the salary part. The estimator has a code for it, spelled
//    the way the Rundown's own reason spells it.
export type LeadershipIsASkipCode = Assert<
  'leadership_not_priced' extends OteSkipCode ? true : false
>;

// 8. The seven reasons, no_ask among them, so the card a declined ask lands on
//    has one spelling in both apps.
export type SevenReasons = Assert<
  Same<
    RundownBenchmarkReason,
    | 'never_made_the_move'
    | 'leadership_not_priced'
    | 'unsupported_country'
    | 'no_estimate'
    | 'thin_cohort'
    | 'no_current_title'
    | 'no_ask'
  >
>;
