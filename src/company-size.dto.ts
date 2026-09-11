/**
 * Company size: the five bands, the pattern a career can have across them,
 * and the one preference a person may state.
 *
 * WHAT THIS IS. Victor, 2026-09-10: "Company size tells us a lot. Maybe
 * someone only wants to work for large organizations and we can easily see
 * that on their profile. Or someone only likes startups or mid-market
 * companies." The plan that answers him (COMPANY-SIZE-ON-MY-MARKET-2026-09-10.md)
 * measured the pool and found the pattern visible on most profiles and worth
 * showing back, and found that it does not move pay, quota or deal size. So
 * the page shows the person their own pattern, asks one question, and stores
 * the answer as a typed preference. This file holds the words both apps use
 * for that: the bands, the pattern labels, the preference and its answer key.
 *
 * THE DOCTRINE (the plan, section 2). A pattern is what the person did. It is
 * never a stated preference. Four companies under 200 can mean "I like small
 * companies", or "that is who hired me", or "I followed one manager three
 * times", and our data cannot tell these apart. So the inferred pattern is a
 * mirror for the candidate, on their own Rundown, and nothing more: it is
 * never sent to a recruiter and never scored. The preference in this file is
 * the person's own words, given once, and it is the only company size fact
 * the FIT score and a recruiter may read.
 *
 * HEADCOUNTS ARE TODAY'S. The company row holds the count today and the count
 * a year ago, no history. A company that has grown since the person left
 * reads bigger than it was on the day they joined, so every sequence leans
 * toward descending and away from climbing, and a startup of ten that is a
 * thousand today reads as a move to a thousand. Every card built on these
 * bands says so in its How we got here, and no sentence reads a band as the
 * size a company had when the person was there.
 *
 * WHY IT LIVES HERE. The bands are read by the Rundown benchmarks (the four
 * company size cards), by the user profile (the stated preference), by the
 * inline answer box and by Barney, in two apps that pin this package as a
 * submodule. One spelling of the five ids and the five labels, here, so a band
 * cannot be "under 50" on one side and "1 to 49" on the other.
 */

// =============================================================================
// THE FIVE BANDS
// =============================================================================

/**
 * The five size bands, by today's headcount: under 50, 50 to 199, 200 to
 * 999, 1,000 to 9,999, 10,000 or more. The ids are the wire spelling and the
 * column spelling; the labels are the words every card and every picker
 * prints. In order from smallest to largest, and the order is part of the
 * contract: a strip of five bars, a band picker and a pattern sentence all
 * walk this list.
 */
export type CompanySizeBand = 'under_50' | '50_199' | '200_999' | '1000_9999' | '10000_plus';

export interface CompanySizeBandSpec {
  id: CompanySizeBand;
  /** The words a card prints: "under 50", "1,000 to 9,999", "10,000 or more". */
  label: string;
  /** The smallest headcount in the band, inclusive. */
  min: number;
  /** The largest headcount in the band, inclusive; null on the open top band. */
  max: number | null;
}

export const COMPANY_SIZE_BANDS: readonly CompanySizeBandSpec[] = [
  { id: 'under_50', label: 'under 50', min: 1, max: 49 },
  { id: '50_199', label: '50 to 199', min: 50, max: 199 },
  { id: '200_999', label: '200 to 999', min: 200, max: 999 },
  { id: '1000_9999', label: '1,000 to 9,999', min: 1000, max: 9999 },
  { id: '10000_plus', label: '10,000 or more', min: 10000, max: null },
];

/** The five ids in band order, for a strip or a picker that wants the ids alone. */
export const COMPANY_SIZE_BAND_IDS: readonly CompanySizeBand[] = COMPANY_SIZE_BANDS.map(
  (band) => band.id,
);

/**
 * The one rule that places a headcount in a band, so the backend's classifier
 * and the frontend's drawing cannot disagree about which band 999 sits in.
 * Null for a missing, non finite or non positive count: a company of zero
 * people carries no headcount, and a card built on it is not_applicable with
 * reason no_headcount rather than a company under 50.
 */
export const companySizeBandOf = (headcount: number | null | undefined): CompanySizeBand | null => {
  if (typeof headcount !== 'number' || !Number.isFinite(headcount) || headcount < 1) return null;
  for (const band of COMPANY_SIZE_BANDS) {
    if (band.max === null || headcount <= band.max) return band.id;
  }
  return null;
};

/** The label for a band id, for a sentence that holds the id and wants the words. */
export const companySizeBandLabel = (band: CompanySizeBand): string =>
  COMPANY_SIZE_BANDS.find((spec) => spec.id === band)?.label ?? band;

// =============================================================================
// THE PATTERN
// =============================================================================

/**
 * What a person's companies did across the bands, read over every distinct
 * company on their dated typed sales roles, each with a headcount. The plan's
 * six patterns, assigned in this order of precedence (the plan, 1a):
 *
 *   all_small    every company under 200 (the two smallest bands), assigned
 *                first, so a seller who went from 30 people to 150 is all
 *                small, not climbing
 *   all_large    every company at 1,000 or more (the two largest bands),
 *                assigned second
 *   flat_mid     every company between 200 and 999; 29 people in the pool,
 *                under the floor, so no pool line is ever quoted for it
 *   climbing     each company bigger than the one before, by today's count
 *   descending   each company smaller than the one before, by today's count
 *   mixed        the rest; needs three or more companies by definition
 *
 * THE SENTENCE SHAPES ARE THE PLAN'S AND THE NEVER SAY COLUMN IS BINDING. The
 * card says the pattern back with the person's real counts and nothing more:
 * "Your {N} companies on file were all under 200 people." "Your {N}
 * companies on file all had 1,000 people or more." "Each of your {N}
 * companies was bigger than the one before, {first} to {current} today."
 * "Each of your {N} companies was smaller than the one before, {first} to
 * {current} today." "You have sold at companies from {smallest} to {largest}
 * people." "Your {N} companies on file were all between 200 and 999 people."
 * Never: "You prefer startups." "You are an enterprise seller." "You are
 * climbing." "You are moving down." Any order word on mixed. Anything about
 * the 29 on flat mid.
 *
 * Null on a card whose companies are not all carrying a headcount: the card
 * still shows the companies it can draw and says how many have no headcount
 * on file, and it prints no pattern label.
 */
export type CompanySizePattern =
  | 'all_small'
  | 'all_large'
  | 'flat_mid'
  | 'climbing'
  | 'descending'
  | 'mixed';

// =============================================================================
// THE PREFERENCE
// =============================================================================

/**
 * How firmly the person means the bands they chose. `only`: show me nothing
 * outside these; the plan's step 3 makes this a wall in the FIT score, in the
 * family of the scorecard's cannot-have, once the snapshot table has shown
 * how many candidates and jobs it walls. `prefer`: these first; a job outside
 * them is shown and ranked, never hidden. The picker's words are "only
 * these" and "these first".
 */
export type CompanySizePreferenceStrength = 'only' | 'prefer';

/**
 * THE ONE QUESTION AND ITS THREE ANSWERS. Under the pattern card the page
 * asks "Is that by choice?" once, and the answer is stored here, in the
 * person's own words, on the user.
 *
 *   "Yes, I prefer companies like these"   bands = the bands of the person's
 *                                          own companies on file, strength
 *                                          'prefer'
 *   "It just happened"                     bands = [], strength 'prefer': the
 *                                          person said the pattern is not a
 *                                          choice, so there is no size to
 *                                          filter or score on, and the card
 *                                          stays as a fact and does not ask
 *                                          again
 *   "I want something different next"     bands = any of the five the person
 *                                          picked, one or more, and the
 *                                          strength they chose
 *
 * `bands` is in band order with no repeats. An empty list is the declared
 * "no preference" and is not the same as a null field: null means the
 * question was never asked or never answered, and the card asks. The FIT
 * score and the recruiter filter read an empty list as no constraint.
 *
 * THIS IS THE ONLY COMPANY SIZE FACT A RECRUITER MAY READ. The plan's step 4
 * has both sides see the same line ("This job is at a company of 50 people.
 * You said you want 1,000 or more." on the job page; "Chose companies of
 * 1,000 or more only; this job is at 50." on the candidate row), and the
 * candidate can change the answer in one click. The pattern the card
 * inferred is never on that line.
 */
export interface CompanySizePreferenceDto {
  bands: CompanySizeBand[];
  strength: CompanySizePreferenceStrength;
}

/**
 * The answer key. POST /rundown/answer takes it with target 'user' and a
 * CompanySizePreferenceDto as the value, the fourth shape on the backend's
 * whitelist beside the number, the split and the list. The pattern card's
 * inline control and Barney's one question at the end of intake both write
 * through it, so there is one writer of the column and one spelling of the
 * key. The column is company_size_preference on the user row, JSON, and the
 * profile reads it back as UserDto.companySizePreference.
 */
export const COMPANY_SIZE_PREFERENCE_FIELD = 'company_size_preference' as const;

export type CompanySizePreferenceField = typeof COMPANY_SIZE_PREFERENCE_FIELD;

/**
 * The server side guard for the answer body. One to five distinct band ids
 * in any order (the backend sorts them into band order before it writes) with
 * one of the two strengths, or an empty list with strength 'prefer' for "It
 * just happened". An empty list with 'only' is refused: nothing at all is
 * not a preference anyone meant to state.
 */
export const isCompanySizePreference = (value: unknown): value is CompanySizePreferenceDto => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const { bands, strength } = value as Record<string, unknown>;
  if (strength !== 'only' && strength !== 'prefer') return false;
  if (!Array.isArray(bands)) return false;
  if (bands.length === 0) return strength === 'prefer';
  if (bands.length > COMPANY_SIZE_BANDS.length) return false;
  const seen = new Set<string>();
  for (const band of bands) {
    if (typeof band !== 'string' || !(COMPANY_SIZE_BAND_IDS as readonly string[]).includes(band)) {
      return false;
    }
    if (seen.has(band)) return false;
    seen.add(band);
  }
  return true;
};
