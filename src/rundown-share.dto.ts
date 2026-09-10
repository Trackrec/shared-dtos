/**
 * The Rundown share. One card of My Market, made public on purpose.
 *
 * WHAT THIS IS. Victor, 2026-09-10: "we need to think about shareability of
 * the my market results, the competition, the humble brags etc, so make it
 * eye popping and 'cool'". A seller who reads a card about their own standing
 * wants to post it. So a ready card in the standing, path or insight band
 * carries a Share action; the seller ticks whether their first name and photo
 * go on it; the backend stores a snapshot of that card at that moment and
 * mints a token; the token is a public page, /s/{token}, with a branded 1200
 * by 630 image (and a 1080 by 1080 square) as its og:image, drawn from the
 * same drawing components the card uses, beside the "See where you stand"
 * LinkedIn door. This file is the shape of all of that, so the backend that
 * writes the snapshot and the frontend that draws it compile against one
 * contract before either is filled.
 *
 * THE RULES THAT DO NOT BEND (my-market-share-ticket.md, the "Share image
 * spec" of my-market-bold-ticket.md). Sharing is opt in per card and per
 * moment: nothing is public by default, and a share is one card at one time.
 * The image carries the first name and the photo only when ticked. Never on
 * the image or the page: current pay, the estimate, anything from band 1, a
 * cohort count, a percentile, an employer, a tenure line, a deal dollar
 * amount (multiples only), a forecast. The cohort reads in words with its
 * confidence level. The token stores a snapshot of the card at share time, so
 * the numbers never drift after posting. Deleting the share 404s the page.
 * The landing page shows the card beside the LinkedIn door, the only door,
 * never the card alone and never an email door. Twenty shares a day per
 * person. The analytics events, share_created and share_viewed, carry the
 * card key and the confidence level only: no value, no name, no token.
 *
 * THE SNAPSHOT IS THE PUBLIC RECORD. RundownPublicShareDto is served to
 * anyone holding the link, as JSON, so the rules above apply to every field of
 * it and not only to the pixels. That is why the snapshot is not the card:
 * the card's cohort carries a count (`size`) for the admin report, the five
 * standing cards' `short` and `claim` rank the person against a percentile,
 * the one role cards' `claim` and `detail` name the role read and its company,
 * the insight cards' `detail` carries the deal dollar figures behind a
 * multiple, and the outbound card's `detail.worth` is a rate card figure. The
 * snapshot keeps what the card face draws and drops the rest, by the lists
 * below, at share time, so a leak is a contract change here and not a
 * rendering choice on one side.
 *
 * WHO MAY SHARE, ONE LIST. The frontend's isShareable (rundownCopy.ts) and the
 * backend's create route both read SHAREABLE_CARD_KEYS, derived here from
 * RUNDOWN_BENCHMARK_CARD_SPEC: the keys whose band is standing, path or
 * insight, minus RUNDOWN_SHARE_NEVER. A card added to the spec in one of the
 * three bands is shareable unless it is added to the never list in the same
 * change, so the question is asked once, here, for every new card. The
 * frontend adds the state rule (ready, and placed as a card); the backend
 * enforces both server side and refuses anything else, because a client can
 * send any key.
 *
 * THE ROUTES are the backend ticket's; the shapes are here. Create takes
 * RundownShareCreateDto on the person's own JWT session and answers
 * RundownShareDto; the person's own list and delete take the token on the
 * same session; the public read takes the token with no session and answers
 * RundownPublicShareDto, 404 when the token is unknown or the share was
 * deleted, on a controller of its own so nothing on the Rundown controller
 * ever answers without a session. The image routes render from the public
 * read and nothing else.
 *
 * WHY IT LIVES HERE. The backend computes and stores, the frontend draws, and
 * this package is a submodule in both, so the shape lands here first. Every
 * name is prefixed RundownShare so it cannot collide with the job post share
 * (shareCard.ts on the frontend) or the first Rundown on either side.
 */

import {
  RUNDOWN_BENCHMARK_CARD_ORDER,
  RUNDOWN_BENCHMARK_CARD_SPEC,
  type RundownBenchmarkBand,
  type RundownBenchmarkCardKey,
  type RundownBenchmarkConfidence,
  type RundownBenchmarkDetailBand,
} from './rundown-benchmarks.dto';

// =============================================================================
// WHO MAY SHARE
// =============================================================================

/**
 * The bands whose ready cards may carry a Share: Where you stand, Your path,
 * Did you know. Band 1, the estimate, is served elsewhere and is not a card;
 * the market band is out because its roles card prints a posting count and
 * the estimate marker, two things the image bans, so the band is the rule and
 * the never list below is the exception list on top of it.
 */
export const RUNDOWN_SHARE_BANDS = ['standing', 'path', 'insight'] as const;

export type RundownShareBand = (typeof RUNDOWN_SHARE_BANDS)[number];

/**
 * The cards inside those bands that never share, decided 2026-09-10.
 * cycle_vs_segment until its units are fixed; earn_vs_worth because it is
 * the pay against the estimate, folded into band 1, and both figures are
 * banned; next_band because it is the estimate's ladder, moved into band 1;
 * ask_vs_offers because it carries the person's ask and the postings' money.
 * The last one is a market card already and sits here so the decision reads
 * in one place. Victor can open band 1 later; that is a new key on this list
 * and nothing else.
 */
export const RUNDOWN_SHARE_NEVER = [
  'cycle_vs_segment',
  'earn_vs_worth',
  'next_band',
  'ask_vs_offers',
] as const;

export type RundownShareNeverKey = (typeof RUNDOWN_SHARE_NEVER)[number];

const shareBands: readonly RundownBenchmarkBand[] = RUNDOWN_SHARE_BANDS;
const neverShared: readonly RundownBenchmarkCardKey[] = RUNDOWN_SHARE_NEVER;

/**
 * Every key a share may be made of, in page order: the standing, path and
 * insight cards of RUNDOWN_BENCHMARK_CARD_SPEC minus RUNDOWN_SHARE_NEVER.
 * Twenty keys today. Derived, not spelled, so both apps read the spec's own
 * bands and a card cannot be shareable on one side and refused on the other.
 * Every key on it has source 'pool', so a ready card of any of them carries a
 * cohort, and the snapshot's cohort is never null.
 */
export const SHAREABLE_CARD_KEYS: readonly RundownBenchmarkCardKey[] =
  RUNDOWN_BENCHMARK_CARD_ORDER.filter(
    (key) =>
      shareBands.includes(RUNDOWN_BENCHMARK_CARD_SPEC[key].band) &&
      !neverShared.includes(key),
  );

/**
 * The server side guard. A request body is untyped until this says yes, and
 * a key that is not on the list is a 400 and never a lookup.
 */
export const isShareableCardKey = (key: unknown): key is RundownBenchmarkCardKey =>
  typeof key === 'string' && (SHAREABLE_CARD_KEYS as readonly string[]).includes(key);

/** Twenty shares a day per person, counted on created shares, deleted ones included. */
export const RUNDOWN_SHARE_DAILY_LIMIT = 20 as const;

// =============================================================================
// THE SNAPSHOT
// =============================================================================

/**
 * The cohort as the image prints it: "Measured on TrackRec against {who}.
 * Confidence {level}." The card's own cohort also carries `label` and `size`
 * for the admin report; `size` is a count, and a count never reaches a public
 * record, so the snapshot's cohort is these two fields and nothing else.
 */
export interface RundownShareCohortDto {
  who: string;
  confidence: RundownBenchmarkConfidence;
}

/**
 * One of the person's own roles with one figure read from it, as quota_record
 * draws one bar per reported role. The card's row also carries `positionId`
 * and `company`; the bar on a share is labeled with the role title alone,
 * because an employer never reaches a public record and an id names a row of
 * ours. `role` is the title as typed ("Account Executive"), `value` the figure
 * as stored (attainment as a whole percentage).
 */
export interface RundownShareDetailRole {
  role: string;
  value: number;
}

/**
 * The detail keys the snapshot never carries, whatever card they sit on.
 * The backend drops them when it writes the snapshot; the frontend's image
 * test asserts none of them is read. By reason: an id of ours (positionId,
 * firstPositionId, latestPositionId); an employer (company, firstCompany,
 * latestCompany); a percentile (percentile); a count (eligible, the fork
 * card's cohort size); a rate card figure (worth, the outbound modifier on
 * today's card); a deal dollar amount behind a multiple (averageDealSize,
 * longDealSize, firstDealSize, latestDealSize, medianFirstDeal,
 * medianLatestDeal). The deal size standing card keeps its `value` and
 * `median`: they are the figure the person typed and the card's face, and the
 * share ticket allows money the person typed themselves.
 *
 * What stays, because the face draws it: value, median, delta, standing
 * (median, above or below, which is the verdict on a share since the
 * percentile is gone), p10 to p90 for the strip, the shares and medians of
 * the path and insight cards, the person's own months and years, `roles`
 * with its rows reduced to RundownShareDetailRole, `bands` as they are (a
 * band carries no count), and `role` (a title, not an employer).
 */
export const RUNDOWN_SHARE_DROPPED_DETAIL_KEYS = [
  'positionId',
  'firstPositionId',
  'latestPositionId',
  'company',
  'firstCompany',
  'latestCompany',
  'percentile',
  'eligible',
  'worth',
  'averageDealSize',
  'longDealSize',
  'firstDealSize',
  'latestDealSize',
  'medianFirstDeal',
  'medianLatestDeal',
] as const;

export type RundownShareDroppedDetailKey = (typeof RUNDOWN_SHARE_DROPPED_DETAIL_KEYS)[number];

/**
 * The same loose record as the card's detail, with one difference: the rows
 * of `roles` carry no id and no employer. A reader on the frontend that takes
 * a RundownBenchmarkDetail has to say so to take one of these, which is the
 * point: the share renderer handles the reduced row on purpose.
 */
export type RundownShareDetailValue =
  | string
  | number
  | null
  | RundownBenchmarkDetailBand[]
  | RundownShareDetailRole[];

export type RundownShareDetail = Record<string, RundownShareDetailValue>;

/**
 * THE CARD AS IT WAS WHEN SHARED. Written once at share time from the card
 * the backend computed for the session's own user at that moment (never from
 * a card the client sends), read every time the page or the image is served,
 * never recomputed, so the figure a person posted is the figure the link
 * shows a year later.
 *
 * The fields are what the image and the public card draw: the title, the
 * figure and its unit, the drawing from `detail`, the verdict in words
 * (from `detail.standing` on a standing card, from the ratio or the duration
 * against the median on an insight card, the `short` on a path card), the
 * range line from p25 and p75, the Did you know band, the cohort line. Three
 * things the card carries are not here on purpose. `claim` never: the image
 * does not draw it, and on the one role cards it names the employer ("Read
 * from Account Executive at Five9") and on the standing cards the percentile.
 * `source` and `unlock`: every shareable key is a pool card and a snapshot is
 * always of a ready card, so both would be constants.
 */
export interface RundownShareCardDto {
  key: RundownBenchmarkCardKey;
  band: RundownBenchmarkBand;
  /** A share is only ever made of a ready card; the backend refuses the other two states. */
  state: 'ready';
  /** The card's title, the same words in every state: "Quota attainment", "Time to closing". */
  title: string;
  /** The big figure as text, the person's own: "118%", "3.5 years", "3.2x". */
  headline: string;
  /** The unit set small beside the figure ("of target"), null when the headline carries its own words. */
  unit: string | null;
  /**
   * The card's short on a path or insight card, where the face prints it
   * ("You stay 2.3 years per role, against a median of 1.8."). Null on a
   * standing card: the five standing cards' short ranks the person against a
   * percentile ("Above 76% of your peers"), the face draws the verdict words
   * instead, and so does the image.
   */
  short: string | null;
  /** The raw figures the drawing reads, minus RUNDOWN_SHARE_DROPPED_DETAIL_KEYS, roles reduced. */
  detail: RundownShareDetail;
  /** Who the person was measured against, in words, and how closely. Never a count. */
  cohort: RundownShareCohortDto;
  /**
   * The Did you know sentence as the card carried it, in the past tense pool
   * form, null when the card had none. It names its cohort in words and
   * carries no count and no percentile by the benchmarks contract already.
   */
  didYouKnow: string | null;
}

// =============================================================================
// THE THREE BODIES
// =============================================================================

/**
 * POST, the person's own session. `cardKey` must be on SHAREABLE_CARD_KEYS
 * and the card the backend computes for the person at that moment must be
 * `ready`, else 400 with no share made. `showName` and `showPhoto` are the
 * two ticks; both default to false on the frontend, and a false tick stores
 * nothing to show, so an untick can never be undone by a later read. The
 * twenty first request of the day is a 429 and the frontend says the limit in
 * words from RUNDOWN_SHARE_DAILY_LIMIT.
 */
export interface RundownShareCreateDto {
  cardKey: RundownBenchmarkCardKey;
  showName: boolean;
  showPhoto: boolean;
}

/**
 * What the owner gets back on create and on their own list: enough to copy
 * the link and to delete the share later. `token` is opaque, URL safe and
 * minted from at least 128 bits of randomness, never derived from the user,
 * the card or the time, and never reused after a delete. `createdAt` is ISO
 * 8601. `url` is the absolute public address, /s/{token} on the app's public
 * origin, built by the backend so the frontend never assembles it; the image
 * prints it without the scheme.
 */
export interface RundownShareDto {
  token: string;
  cardKey: RundownBenchmarkCardKey;
  createdAt: string;
  url: string;
}

/**
 * GET by token, no session. Everything the public page and the two image
 * sizes draw, and nothing else. `firstName` is the person's first name when
 * they ticked it, null otherwise (so no initial is derivable either);
 * `photoUrl` is their photo when they ticked it, null otherwise. `roleFamily`
 * is the role family in words as the image's top row prints it ("Enterprise
 * account executive"), never the company, null when the current title
 * resolves to no family. `sharedAt` is the snapshot's time, ISO 8601, the
 * same instant as the owner's `createdAt`. No user id, no user name, no
 * email, no currency of the person's beyond what the card's own figures
 * print, and the response carries no field a recruiter surface could reuse.
 */
export interface RundownPublicShareDto {
  token: string;
  card: RundownShareCardDto;
  firstName: string | null;
  photoUrl: string | null;
  roleFamily: string | null;
  sharedAt: string;
}
