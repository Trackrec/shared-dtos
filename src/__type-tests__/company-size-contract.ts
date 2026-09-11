/**
 * COMPILE-TIME ASSERTIONS FOR THE COMPANY SIZE CONTRACT. No runtime, no
 * runner: `tsc --noEmit` is the test, and a failing assertion is a type error
 * on the line that names it.
 *
 * WHAT THIS GUARDS. The five band ids are a column spelling and a wire
 * spelling at once; the preference is the only company size fact a recruiter
 * may read, and its shape is the plan's (bands and a strength, nothing
 * inferred); the answer key is one string both apps and Barney write through;
 * and the profile field is optional, so the backend that assigns its entity
 * to UserDto keeps compiling until the column lands. A later edit that
 * widened the preference with an inferred pattern, renamed a band, or made
 * the field required would compile fine here and break one app, or one rule,
 * with no test of its own to say why. These lines say why.
 */
import type {
  CompanySizeBand,
  CompanySizeBandSpec,
  CompanySizePattern,
  CompanySizePreferenceDto,
  CompanySizePreferenceField,
  CompanySizePreferenceStrength,
} from '../company-size.dto';
import {
  COMPANY_SIZE_BAND_IDS,
  COMPANY_SIZE_BANDS,
  COMPANY_SIZE_PREFERENCE_FIELD,
  companySizeBandOf,
  isCompanySizePreference,
} from '../company-size.dto';
import type { ExtendedUserDetailsDto, UserDto } from '../user.dto';

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

// 1. The five bands, spelled as the plan spells them, smallest to largest.
export type FiveBands = Assert<
  Same<CompanySizeBand, 'under_50' | '50_199' | '200_999' | '1000_9999' | '10000_plus'>
>;
export type BandSpecShape = Assert<
  Same<CompanySizeBandSpec, { id: CompanySizeBand; label: string; min: number; max: number | null }>
>;
export type BandsAreSpecs = Assert<Same<typeof COMPANY_SIZE_BANDS, readonly CompanySizeBandSpec[]>>;
export type BandIdsAreBands = Assert<Same<typeof COMPANY_SIZE_BAND_IDS, readonly CompanySizeBand[]>>;
// The one placing rule answers with a band or nothing, never a sixth word.
export type BandOfIsABandOrNothing = Assert<
  Same<ReturnType<typeof companySizeBandOf>, CompanySizeBand | null>
>;

// 2. The six patterns, in the plan's words. A pattern is a label on the
//    person's own card and nothing else: it is not a member of the preference
//    below, so it cannot be stored as one or read by a recruiter as one.
export type SixPatterns = Assert<
  Same<
    CompanySizePattern,
    'all_small' | 'all_large' | 'flat_mid' | 'climbing' | 'descending' | 'mixed'
  >
>;

// 3. The preference is bands and a strength, no more: no inferred pattern,
//    no headcount, no confidence. `only` and `prefer` are the two strengths
//    the picker offers ("only these", "these first").
export type TwoStrengths = Assert<Same<CompanySizePreferenceStrength, 'only' | 'prefer'>>;
export type PreferenceShape = Assert<
  Same<CompanySizePreferenceDto, { bands: CompanySizeBand[]; strength: CompanySizePreferenceStrength }>
>;
export type PreferenceHasNoPattern = Assert<Lacks<CompanySizePreferenceDto, 'pattern'>>;
export type PreferenceHasNoHeadcount = Assert<Lacks<CompanySizePreferenceDto, 'headcount'>>;
export type PreferenceGuardIsAGuard = Assert<
  Same<ReturnType<typeof isCompanySizePreference>, boolean>
>;

// 4. The answer key, as a literal, so the inline control, Barney and the
//    backend whitelist spell one string.
export type TheAnswerKey = Assert<Same<CompanySizePreferenceField, 'company_size_preference'>>;
export type TheAnswerKeyConstant = Assert<
  Same<typeof COMPANY_SIZE_PREFERENCE_FIELD, 'company_size_preference'>
>;

// 5. The profile carries the preference, optional, typed as the preference.
//    Optional because the backend assigns its entity to UserDto and would
//    stop compiling at the pointer move otherwise; typed so a reader cannot
//    take a bare string for it. This pins the base type; the `| null` is
//    documentation, since this package and both apps compile with
//    strictNullChecks off.
export type ProfileFieldIsOptional = Assert<AllOptional<UserDto, 'companySizePreference'>>;
export type ProfileFieldIsThePreference = Assert<
  Same<NonNullable<UserDto['companySizePreference']>, CompanySizePreferenceDto>
>;
// The profile the app reads at /me extends UserDto, so it carries the field too.
export type MeCarriesThePreference = Assert<
  Same<NonNullable<ExtendedUserDetailsDto['companySizePreference']>, CompanySizePreferenceDto>
>;
