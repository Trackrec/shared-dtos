/**
 * A must have has to bite.
 *
 * VICTOR'S RULE, 2026-09-02: "I want recruiters to tell us which criteria is
 * super important and which one is not, we used a system from five to zero,
 * five being the most important, zero being non-important, and we were supposed
 * to weigh in on these in the final score. So if someone says I want 5 on 5 on
 * 100 percent new business it has to be strict. I'm okay with some level of
 * flexibility sometimes, but if someone says this is what we're looking for
 * then this is it and it has to reflect in their score."
 *
 * WHY THE WEIGHTS COULD NOT DO THIS. Scoring normalises the coefficients:
 * `weight = coefficient / sum of coefficients`. Mark new business 5 and leave
 * the rest at 3 and business mix gets 5/44 of the score, about 11%. So a
 * candidate who scores ZERO on the one non-negotiable still lands at 89% and
 * sits near the top of the list. Proportional weighting cannot express "this
 * one is not optional", however high you set it.
 *
 * ONLY A COEFFICIENT SOMEBODY ACTUALLY SET, and this is the part that would be
 * easy to get catastrophically wrong. `getScorePercentage` fills every unset
 * coefficient with 5, the top of the scale. So on a job nobody weighted, all
 * fourteen read 5, and a naive "5 means must have" would gate every candidate
 * on every criterion and empty the list. A must have therefore has to be
 * present in the STORED coefficients object, not arrived at by the default
 * fill. A job with no coefficients row has no must haves at all.
 *
 * `productType` can never be a must have today: it is in the scorer's fourteen
 * keys and has no column in the coefficients JSON, so it is always defaulted.
 * That is a real gap in the entity rather than a decision, and it is left
 * visible here rather than papered over.
 */

/** The scorer's fourteen keys, in its own order. */
export type CriterionKey =
  | 'ote'
  | 'location'
  | 'experience'
  | 'businessMix'
  | 'leadSource'
  | 'dealSize'
  | 'salesCycle'
  | 'segment'
  | 'territory'
  | 'industryWorksIn'
  | 'industrySoldTo'
  | 'persona'
  | 'companyOverlap'
  | 'productType';

/** The top of Victor's nought-to-five scale. */
export const MUST_HAVE = 5;

/**
 * The bar a must have has to clear, out of ten.
 *
 * FIVE, because Victor asked for strictness with room: "I'm okay with some
 * level of flexibility sometimes". Half marks is the flexibility. A candidate
 * at 8 out of 10 on a must have is somebody who nearly matches and belongs in
 * the list; a candidate at 2 is somebody the recruiter said they did not want.
 */
export const MUST_HAVE_BAR = 5;

/** How the criteria read to a person, for the reason we show. */
export const CRITERION_LABEL: Record<CriterionKey, string> = {
  ote: 'OTE',
  location: 'location',
  experience: 'experience',
  businessMix: 'business mix',
  leadSource: 'lead source',
  dealSize: 'deal size',
  salesCycle: 'sales cycle',
  segment: 'segment',
  territory: 'territory',
  industryWorksIn: 'industry worked in',
  industrySoldTo: 'industry sold to',
  persona: 'buyer personas',
  companyOverlap: 'company overlap',
  productType: 'product type',
};

/**
 * The criteria this recruiter marked non-negotiable.
 *
 * Reads the stored object directly and never the merged one, for the reason in
 * the header: the merged object cannot tell a decision from a default.
 */
export const mustHavesOf = (
  stored: Partial<Record<CriterionKey, number>> | null | undefined,
): CriterionKey[] => {
  if (!stored) return [];
  return (Object.keys(stored) as CriterionKey[]).filter((key) => stored[key] === MUST_HAVE);
};

export interface FailedMustHave {
  criterion: CriterionKey;
  /** For the surface, already in words. */
  label: string;
  /** What they scored, out of ten. */
  scored: number;
}

/**
 * Which must haves this candidate does not clear.
 *
 * AN UNASSESSED MUST HAVE CANNOT FAIL. 'Unknown' and undefined mean nobody
 * could measure it, and the score already excludes those from both halves. A
 * candidate must not be refused for a gap in our data: the cost of being wrong
 * in that direction lands on a person, and the cost in the other direction is
 * one recruiter reading one extra profile.
 */
export const failedMustHaves = (
  stored: Partial<Record<CriterionKey, number>> | null | undefined,
  scores: Partial<Record<CriterionKey, number | string | null | undefined>>,
): FailedMustHave[] =>
  mustHavesOf(stored)
    .map((criterion) => {
      const raw = scores[criterion];
      if (raw === null || raw === undefined || raw === 'Unknown') return null;
      const scored = Number(raw);
      if (!Number.isFinite(scored)) return null;
      if (scored >= MUST_HAVE_BAR) return null;
      return { criterion, label: CRITERION_LABEL[criterion], scored };
    })
    .filter((failure): failure is FailedMustHave => failure !== null);
