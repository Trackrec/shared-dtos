/**
 * COMPILE-TIME ASSERTIONS FOR THE NEXT COMPANY STAGE CONTRACT. No runtime, no
 * runner: `tsc --noEmit` is the test, and a failing assertion is a type error
 * on the line that names it.
 *
 * WHAT THIS GUARDS. The five band ids are a column spelling and a wire
 * spelling at once, on Victor's ladder (under 20, 20 to 49, 50 to 199, 200 to
 * 999, 1,000 and more); the three strengths are the three chip words and
 * nothing else; the answer is bands and a strength, with no headcount, no
 * verdict and no borrowed pattern; the answer key is one string Barney, the
 * profile block and the backend whitelist all spell; the profile field, the
 * public profile field and the suggested row field are optional, so the
 * backend that assigns its entity to these types keeps compiling at the
 * pointer move; and the ladder is its own type, not the company size bands.
 */
import type { CompanySizeBand } from '../company-size.dto';
import type {
  NextCompanyStageBand,
  NextCompanyStageBandSpec,
  NextCompanyStageDto,
  NextCompanyStageField,
  NextCompanyStageStrength,
} from '../next-company-stage.dto';
import {
  NEXT_COMPANY_STAGE_BAND_IDS,
  NEXT_COMPANY_STAGE_BANDS,
  NEXT_COMPANY_STAGE_FIELD,
  NEXT_COMPANY_STAGE_LABELS,
  NEXT_COMPANY_STAGE_STRENGTH_WORDS,
  isNextCompanyStage,
  nextCompanyStageBandOf,
  nextCompanyStageLine,
} from '../next-company-stage.dto';
import type { SuggestedCandidateDto } from '../recruiter_project.dto';
import type { ExtendedUserDetailsDto, PublicProfileUserDto, UserDto } from '../user.dto';

type Assert<T extends true> = T;

/** True when A and B accept exactly the same values. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** The keys of T that may be left out of an object literal. */
type OptionalKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? K : never;
}[keyof T];

/** True when every member of Fields is an optional key of T. */
type AllOptional<T, Fields extends keyof T> = [Fields] extends [OptionalKeys<T>] ? true : false;

/** True when K is not a key of T. */
type Lacks<T, K extends string> = K extends keyof T ? false : true;

// 1. The five bands, on Victor's ladder, smallest to largest.
export type FiveBands = Assert<
  Same<NextCompanyStageBand, 'under_20' | '20_49' | '50_199' | '200_999' | '1000_plus'>
>;
export type BandSpecShape = Assert<
  Same<
    NextCompanyStageBandSpec,
    {
      id: NextCompanyStageBand;
      label: string;
      headcount: string;
      min: number;
      max: number | null;
    }
  >
>;
export type BandsAreSpecs = Assert<
  Same<typeof NEXT_COMPANY_STAGE_BANDS, readonly NextCompanyStageBandSpec[]>
>;
export type BandIdsAreBands = Assert<
  Same<typeof NEXT_COMPANY_STAGE_BAND_IDS, readonly NextCompanyStageBand[]>
>;
export type LabelsCoverEveryBand = Assert<
  Same<keyof typeof NEXT_COMPANY_STAGE_LABELS, NextCompanyStageBand>
>;
// The one placing rule answers with a band or nothing, never a sixth word.
export type BandOfIsABandOrNothing = Assert<
  Same<ReturnType<typeof nextCompanyStageBandOf>, NextCompanyStageBand | null>
>;
// The ladder is not the company size bands: a band of one cannot be handed
// to a reader of the other.
export type NotTheCompanySizeBands = Assert<
  [NextCompanyStageBand] extends [CompanySizeBand] ? false : true
>;

// 2. Three strengths, the three chip words, and open is one of them: "Open
//    to anything" is a stored answer, not a null.
export type ThreeStrengths = Assert<Same<NextCompanyStageStrength, 'prefer' | 'only' | 'open'>>;
export type WordsCoverEveryStrength = Assert<
  Same<keyof typeof NEXT_COMPANY_STAGE_STRENGTH_WORDS, NextCompanyStageStrength>
>;

// 3. The answer is bands and a strength, no more.
export type AnswerShape = Assert<
  Same<NextCompanyStageDto, { bands: NextCompanyStageBand[]; strength: NextCompanyStageStrength }>
>;
export type AnswerHasNoHeadcount = Assert<Lacks<NextCompanyStageDto, 'headcount'>>;
export type AnswerHasNoPattern = Assert<Lacks<NextCompanyStageDto, 'pattern'>>;
export type AnswerHasNoScore = Assert<Lacks<NextCompanyStageDto, 'score'>>;
export type GuardIsAGuard = Assert<Same<ReturnType<typeof isNextCompanyStage>, boolean>>;
export type LineIsWords = Assert<Same<ReturnType<typeof nextCompanyStageLine>, string>>;

// 4. The answer key, as a literal, so Barney, the profile block and the
//    backend whitelist spell one string.
export type TheAnswerKey = Assert<Same<NextCompanyStageField, 'next_company_stage'>>;
export type TheAnswerKeyConstant = Assert<
  Same<typeof NEXT_COMPANY_STAGE_FIELD, 'next_company_stage'>
>;

// 5. The three places it travels carry it optional and typed.
export type ProfileFieldIsOptional = Assert<AllOptional<UserDto, 'nextCompanyStage'>>;
export type ProfileFieldIsTheAnswer = Assert<
  Same<NonNullable<UserDto['nextCompanyStage']>, NextCompanyStageDto>
>;
export type MeCarriesTheAnswer = Assert<
  Same<NonNullable<ExtendedUserDetailsDto['nextCompanyStage']>, NextCompanyStageDto>
>;
export type PublicProfileFieldIsOptional = Assert<
  AllOptional<PublicProfileUserDto, 'nextCompanyStage'>
>;
export type PublicProfileFieldIsTheAnswer = Assert<
  Same<NonNullable<PublicProfileUserDto['nextCompanyStage']>, NextCompanyStageDto>
>;
export type SuggestedRowFieldIsOptional = Assert<
  AllOptional<SuggestedCandidateDto['user'], 'nextCompanyStage'>
>;
export type SuggestedRowFieldIsTheAnswer = Assert<
  Same<NonNullable<SuggestedCandidateDto['user']['nextCompanyStage']>, NextCompanyStageDto>
>;
