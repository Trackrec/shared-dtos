/**
 * The company a seller wants next: five stage bands, three strengths, one
 * answer key.
 *
 * WHAT THIS IS. Victor, 2026-09-19: "an option for users to tell us the
 * company stage they want to join next ... or open to anything." One question
 * on the seller's Next role, answered once, in their own words: which kinds
 * of company they would take, and how firmly. A recruiter reads it back as a
 * quiet line beside "Willing to relocate". It is never a gate: nothing
 * filters, sorts, hides or scores on it.
 *
 * THE LADDER IS VICTOR'S (2026-09-19): "early stage startup is not even under
 * 50. It's under 20. Then we can do 20 to 50 startup, 50 to 200 scale up, and
 * then move from there." Founding AE is a title, so it lives on the next
 * titles, not on this ladder.
 *
 * WHY A NEW CONTRACT AND NOT THE COMPANY SIZE BANDS. company-size.dto.ts holds
 * the five headcount bands My Market uses to say a seller's past pattern back
 * to them, and the answer to "Is that by choice?". Those bands cut at 50, 200,
 * 1,000 and 10,000. This ladder cuts at 20, 50, 200 and 1,000 and speaks in
 * stage words, and it is stored in its own column, next_company_stage, so the
 * two answers cannot be misquoted as each other. Neither file imports the
 * other.
 *
 * WHY IT LIVES HERE. Barney's next role chapter asks it, the profile's Next
 * role block asks it, the backend stores it and the recruiter's ranking rows
 * print it, in two apps that pin this package as a submodule. One spelling of
 * the five ids, the five labels and the three strength words.
 */

// =============================================================================
// THE FIVE BANDS
// =============================================================================

/**
 * The five stage bands by today's headcount, smallest first. The ids are the
 * wire spelling and the column spelling; the order is part of the contract:
 * every picker walks this list top to bottom.
 */
export type NextCompanyStageBand = 'under_20' | '20_49' | '50_199' | '200_999' | '1000_plus';

export interface NextCompanyStageBandSpec {
  id: NextCompanyStageBand;
  /** The stage word a chip prints: "Early stage startup", "Scale up". */
  label: string;
  /** The headcount under the word: "under 20 people", "1,000 and more". */
  headcount: string;
  /** The smallest headcount in the band, inclusive. */
  min: number;
  /** The largest headcount in the band, inclusive; null on the open top band. */
  max: number | null;
}

export const NEXT_COMPANY_STAGE_BANDS: readonly NextCompanyStageBandSpec[] = [
  { id: 'under_20', label: 'Early stage startup', headcount: 'under 20 people', min: 1, max: 19 },
  { id: '20_49', label: 'Startup', headcount: '20 to 49 people', min: 20, max: 49 },
  { id: '50_199', label: 'Scale up', headcount: '50 to 199 people', min: 50, max: 199 },
  { id: '200_999', label: 'Growth company', headcount: '200 to 999 people', min: 200, max: 999 },
  {
    id: '1000_plus',
    label: 'Large company',
    headcount: '1,000 people and more',
    min: 1000,
    max: null,
  },
];

/** The five ids in band order, for a picker that wants the ids alone. */
export const NEXT_COMPANY_STAGE_BAND_IDS: readonly NextCompanyStageBand[] =
  NEXT_COMPANY_STAGE_BANDS.map((band) => band.id);

/** The five labels by id, the words every chip and every recruiter line prints. */
export const NEXT_COMPANY_STAGE_LABELS: Readonly<Record<NextCompanyStageBand, string>> = {
  under_20: 'Early stage startup',
  '20_49': 'Startup',
  '50_199': 'Scale up',
  '200_999': 'Growth company',
  '1000_plus': 'Large company',
};

/**
 * The one rule that places a headcount on the ladder, so the lead chip
 * Barney builds from a seller's own companies and any later job side band
 * cannot disagree about where 49 sits. Null for a missing, non finite or non
 * positive count: a company of nobody has no stage.
 */
export const nextCompanyStageBandOf = (
  headcount: number | null | undefined,
): NextCompanyStageBand | null => {
  if (typeof headcount !== 'number' || !Number.isFinite(headcount) || headcount < 1) return null;
  for (const band of NEXT_COMPANY_STAGE_BANDS) {
    if (band.max === null || headcount <= band.max) return band.id;
  }
  return null;
};

/** The label for a band id, for a sentence that holds the id and wants the word. */
export const nextCompanyStageLabel = (band: NextCompanyStageBand): string =>
  NEXT_COMPANY_STAGE_LABELS[band] ?? band;

// =============================================================================
// THE STRENGTH
// =============================================================================

/**
 * How firmly the seller means the bands they picked. `prefer`: these first,
 * a job outside them is still shown. `only`: only these. `open`: open to
 * anything, with no bands at all. None of the three is a wall anywhere:
 * "Only these" is a word the recruiter reads, never a filter.
 */
export type NextCompanyStageStrength = 'prefer' | 'only' | 'open';

/** The chip words for the three strengths, with a capital. */
export const NEXT_COMPANY_STAGE_STRENGTH_WORDS: Readonly<Record<NextCompanyStageStrength, string>> =
  {
    prefer: 'These first',
    only: 'Only these',
    open: 'Open to anything',
  };

// =============================================================================
// THE ANSWER
// =============================================================================

/**
 * The stored answer: the bands in band order with no repeats, and a strength.
 * `open` carries no bands, and is the only strength that may. Null on the
 * column means never asked or never answered, and the question is asked.
 */
export interface NextCompanyStageDto {
  bands: NextCompanyStageBand[];
  strength: NextCompanyStageStrength;
}

/**
 * The answer key. POST /rundown/answer takes it with target 'user' and a
 * NextCompanyStageDto (or null, to clear) as the value; Barney writes through
 * the same field, so there is one writer of the column and one spelling of
 * the key. The column is next_company_stage on the user row, JSON, read back
 * as UserDto.nextCompanyStage.
 */
export const NEXT_COMPANY_STAGE_FIELD = 'next_company_stage' as const;

export type NextCompanyStageField = typeof NEXT_COMPANY_STAGE_FIELD;

/**
 * The server side guard for the answer body. One to five distinct band ids in
 * any order (the backend sorts them before it writes) with prefer or only, or
 * an empty list with open. An empty list with prefer or only is refused, and
 * so is a band list with open: the two halves have to agree.
 */
export const isNextCompanyStage = (value: unknown): value is NextCompanyStageDto => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const { bands, strength } = value as Record<string, unknown>;
  if (strength !== 'prefer' && strength !== 'only' && strength !== 'open') return false;
  if (!Array.isArray(bands)) return false;
  if (strength === 'open') return bands.length === 0;
  if (bands.length === 0 || bands.length > NEXT_COMPANY_STAGE_BANDS.length) return false;
  const seen = new Set<string>();
  for (const band of bands) {
    if (
      typeof band !== 'string' ||
      !(NEXT_COMPANY_STAGE_BAND_IDS as readonly string[]).includes(band)
    ) {
      return false;
    }
    if (seen.has(band)) return false;
    seen.add(band);
  }
  return true;
};

// =============================================================================
// THE WORDS BOTH SIDES PRINT
// =============================================================================

/** The recruiter line for an open answer. */
export const OPEN_TO_ANY_COMPANY_LINE = 'Open to any company';

const lower = (label: string): string => label.toLowerCase();

const article = (label: string): string => (/^[aeiou]/i.test(label) ? 'an' : 'a');

/**
 * The quiet line a recruiter reads beside "Willing to relocate", in the
 * seller's own terms and nothing more: "Wants a startup or scale up, these
 * first", "Wants a large company only", "Wants an early stage startup or
 * startup, these first", "Open to any company". Never a headcount figure and
 * never a verdict.
 */
export const nextCompanyStageLine = (answer: NextCompanyStageDto): string => {
  if (answer.strength === 'open' || answer.bands.length === 0) return OPEN_TO_ANY_COMPANY_LINE;
  const labels = NEXT_COMPANY_STAGE_BAND_IDS.filter((band) => answer.bands.includes(band)).map(
    (band) => lower(nextCompanyStageLabel(band)),
  );
  const wants = `Wants ${article(labels[0])} ${labels.join(' or ')}`;
  return answer.strength === 'only' ? `${wants} only` : `${wants}, these first`;
};
