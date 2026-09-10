/**
 * COMPILE-TIME ASSERTIONS FOR THE RUNDOWN SHARE CONTRACT. No runtime, no
 * runner: `tsc --noEmit` is the test, and a failing assertion is a type error
 * on the line that names it.
 *
 * WHAT THIS GUARDS. The public share is served as JSON to anyone holding the
 * link, so the shape of the snapshot is the privacy rule: a field added to it
 * is a field the world can read. These lines pin the three bodies, the
 * snapshot's property set (no claim, no source, no unlock, a cohort with no
 * count, role rows with no employer and no id), the bands and the never list
 * the shareable keys derive from, the dropped detail keys, and the daily
 * limit, so a later edit that widens one fails here with a line that says why.
 */
import type {
  RundownBenchmarkBand,
  RundownBenchmarkCardDto,
  RundownBenchmarkCardKey,
  RundownBenchmarkCohortDto,
  RundownBenchmarkDetailBand,
} from '../rundown-benchmarks.dto';
import type {
  RundownPublicShareDto,
  RundownShareBand,
  RundownShareCardDto,
  RundownShareCohortDto,
  RundownShareCreateDto,
  RundownShareDetail,
  RundownShareDetailRole,
  RundownShareDetailValue,
  RundownShareDroppedDetailKey,
  RundownShareDto,
  RundownShareNeverKey,
} from '../rundown-share.dto';
import {
  RUNDOWN_SHARE_BANDS,
  RUNDOWN_SHARE_DAILY_LIMIT,
  RUNDOWN_SHARE_DROPPED_DETAIL_KEYS,
  RUNDOWN_SHARE_NEVER,
  SHAREABLE_CARD_KEYS,
} from '../rundown-share.dto';

type Assert<T extends true> = T;

/** True when A and B accept exactly the same values. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** True when K is not a key of T. */
type Lacks<T, K extends string> = K extends keyof T ? false : true;

type Length<T extends readonly unknown[]> = T['length'];

// 1. The three bodies carry the ticket's fields, no more and no less.
export type CreateHasTheTicketsKeys = Assert<
  Same<keyof RundownShareCreateDto, 'cardKey' | 'showName' | 'showPhoto'>
>;
export type CreateKeyIsACardKey = Assert<
  Same<RundownShareCreateDto['cardKey'], RundownBenchmarkCardKey>
>;
export type TheTwoTicksAreBooleans = Assert<
  Same<RundownShareCreateDto['showName'] | RundownShareCreateDto['showPhoto'], boolean>
>;

export type OwnerHasTheTicketsKeys = Assert<
  Same<keyof RundownShareDto, 'token' | 'cardKey' | 'createdAt' | 'url'>
>;
export type OwnerStringsAreStrings = Assert<
  Same<RundownShareDto['token'] | RundownShareDto['createdAt'] | RundownShareDto['url'], string>
>;
export type OwnerKeyIsACardKey = Assert<Same<RundownShareDto['cardKey'], RundownBenchmarkCardKey>>;

export type PublicHasTheTicketsKeys = Assert<
  Same<
    keyof RundownPublicShareDto,
    'token' | 'card' | 'firstName' | 'photoUrl' | 'roleFamily' | 'sharedAt'
  >
>;
export type PublicCardIsTheSnapshot = Assert<
  Same<RundownPublicShareDto['card'], RundownShareCardDto>
>;
// The person's three optional words are strings or nothing. This pins the
// base type; the `| null` is documentation, since this package and both apps
// compile with strictNullChecks off, where `string | null` and `string` are
// one type.
export type PublicPersonFieldsAreStrings = Assert<
  Same<
    | RundownPublicShareDto['firstName']
    | RundownPublicShareDto['photoUrl']
    | RundownPublicShareDto['roleFamily'],
    string | null
  >
>;
// Nothing on the public body names the person beyond the ticked fields.
export type PublicHasNoUserId = Assert<Lacks<RundownPublicShareDto, 'userId'>>;
export type PublicHasNoUserName = Assert<Lacks<RundownPublicShareDto, 'userName'>>;
export type PublicHasNoEmail = Assert<Lacks<RundownPublicShareDto, 'email'>>;
export type PublicHasNoLastName = Assert<Lacks<RundownPublicShareDto, 'lastName'>>;

// 2. The snapshot is the card face and nothing else: ten fields.
export type SnapshotHasTheFaceKeys = Assert<
  Same<
    keyof RundownShareCardDto,
    | 'key'
    | 'band'
    | 'state'
    | 'title'
    | 'headline'
    | 'unit'
    | 'short'
    | 'detail'
    | 'cohort'
    | 'didYouKnow'
  >
>;
// The claim names the employer on the one role cards and the percentile on
// the standing cards; it never reaches a snapshot.
export type SnapshotHasNoClaim = Assert<Lacks<RundownShareCardDto, 'claim'>>;
export type SnapshotHasNoSource = Assert<Lacks<RundownShareCardDto, 'source'>>;
export type SnapshotHasNoUnlock = Assert<Lacks<RundownShareCardDto, 'unlock'>>;
// A share is made of a ready card only; a snapshot of a locked card is a
// type error on the line that builds it.
export type SnapshotIsAlwaysReady = Assert<Same<RundownShareCardDto['state'], 'ready'>>;
// Every field the snapshot copies from the card is the card's own type, so a
// renamed or retyped card field fails here and not in one app.
export type SnapshotKeyIsTheCards = Assert<
  Same<RundownShareCardDto['key'], RundownBenchmarkCardDto['key']>
>;
export type SnapshotBandIsTheCards = Assert<
  Same<RundownShareCardDto['band'], RundownBenchmarkCardDto['band']>
>;
export type SnapshotTitleIsTheCards = Assert<
  Same<RundownShareCardDto['title'], RundownBenchmarkCardDto['title']>
>;
export type SnapshotHeadlineIsTheCards = Assert<
  Same<RundownShareCardDto['headline'], RundownBenchmarkCardDto['headline']>
>;
export type SnapshotUnitIsTheCards = Assert<
  Same<RundownShareCardDto['unit'], RundownBenchmarkCardDto['unit']>
>;
export type SnapshotDidYouKnowIsTheCards = Assert<
  Same<RundownShareCardDto['didYouKnow'], RundownBenchmarkCardDto['didYouKnow']>
>;
export type SnapshotShortIsAStringOrNothing = Assert<
  Same<RundownShareCardDto['short'], string | null>
>;

// 3. The cohort on a share is who and confidence, picked off the card's
//    cohort, and never the count or the admin label.
export type ShareCohortIsWhoAndConfidence = Assert<
  Same<RundownShareCohortDto, Pick<RundownBenchmarkCohortDto, 'who' | 'confidence'>>
>;
export type ShareCohortHasNoSize = Assert<Lacks<RundownShareCohortDto, 'size'>>;
export type ShareCohortHasNoLabel = Assert<Lacks<RundownShareCohortDto, 'label'>>;
export type SnapshotCohortIsTheShareCohort = Assert<
  Same<RundownShareCardDto['cohort'], RundownShareCohortDto>
>;

// 4. The detail is the card's loose record with the role rows reduced: a row
//    on a share is a title and a figure, no id and no employer. The bands
//    travel as they are, since a band carries no count.
export type ShareRoleIsTitleAndFigure = Assert<
  Same<RundownShareDetailRole, { role: string; value: number }>
>;
export type ShareRoleHasNoCompany = Assert<Lacks<RundownShareDetailRole, 'company'>>;
export type ShareRoleHasNoPositionId = Assert<Lacks<RundownShareDetailRole, 'positionId'>>;
export type ShareDetailValueIsScalarOrOneOfTwoLists = Assert<
  Same<
    RundownShareDetailValue,
    string | number | null | RundownBenchmarkDetailBand[] | RundownShareDetailRole[]
  >
>;
export type ShareDetailIsALooseRecord = Assert<
  Same<RundownShareDetail, Record<string, RundownShareDetailValue>>
>;
export type SnapshotDetailIsTheShareDetail = Assert<
  Same<RundownShareCardDto['detail'], RundownShareDetail>
>;

// 5. The dropped detail keys, spelled as the backend writes them (cards.ts
//    roleDetail and the insight cards' detail), so the backend's writer and
//    the frontend's image test read one list.
export type FifteenDroppedKeys = Assert<
  Same<
    RundownShareDroppedDetailKey,
    | 'positionId'
    | 'firstPositionId'
    | 'latestPositionId'
    | 'company'
    | 'firstCompany'
    | 'latestCompany'
    | 'percentile'
    | 'eligible'
    | 'worth'
    | 'averageDealSize'
    | 'longDealSize'
    | 'firstDealSize'
    | 'latestDealSize'
    | 'medianFirstDeal'
    | 'medianLatestDeal'
  >
>;
export type DroppedKeysListEachOnce = Assert<
  Same<Length<typeof RUNDOWN_SHARE_DROPPED_DETAIL_KEYS>, 15>
>;

// 6. Who may share derives from three bands and four exceptions, each a real
//    band or key of the benchmarks contract, so a card renamed there fails
//    here rather than silently leaving the never list.
export type ThreeShareBands = Assert<Same<RundownShareBand, 'standing' | 'path' | 'insight'>>;
export type ShareBandsAreBands = Assert<RundownShareBand extends RundownBenchmarkBand ? true : false>;
export type ShareBandsListEachOnce = Assert<Same<Length<typeof RUNDOWN_SHARE_BANDS>, 3>>;
export type FourNeverKeys = Assert<
  Same<RundownShareNeverKey, 'cycle_vs_segment' | 'earn_vs_worth' | 'next_band' | 'ask_vs_offers'>
>;
export type NeverKeysAreCardKeys = Assert<
  RundownShareNeverKey extends RundownBenchmarkCardKey ? true : false
>;
export type NeverKeysListEachOnce = Assert<Same<Length<typeof RUNDOWN_SHARE_NEVER>, 4>>;
// The derived list is a read only list of card keys. Its contents are the
// spec's at runtime and cannot be pinned here; the backend's own spec asserts
// the twenty keys against the spec's bands.
export type ShareableKeysAreCardKeys = Assert<
  Same<typeof SHAREABLE_CARD_KEYS, readonly RundownBenchmarkCardKey[]>
>;

// 7. Twenty a day, as a literal, so the frontend's wording and the backend's
//    counter read one number.
export type TwentyADay = Assert<Same<typeof RUNDOWN_SHARE_DAILY_LIMIT, 20>>;
