/**
 * COMPILE-TIME ASSERTIONS FOR THE LABEL AND KEY TYPES. No runtime, no runner:
 * `tsc --noEmit` is the test, and a failing assertion is a type error on the
 * line that names it.
 *
 * WHAT THIS GUARDS. This package is a submodule in two apps that move the
 * pointer in separate merge commits, so a field added here is compiled by both
 * before either fills it. Every field this change adds is therefore optional,
 * and a later edit that makes one required would break the other app at its
 * next build with no test of its own to say why. These lines say why.
 */
import type { IndustryKeyDto } from '../industry.dto';
import type { OteIndustryAdjustment } from '../ote-estimation-details.dto';
import type { PositionDetailsDto } from '../position_detail.dto';
import type { RecruiterProjectDto } from '../recruiter_project.dto';
import type { ParsedResume } from '../user.dto';

type Assert<T extends true> = T;

/** The keys of T that may be left out of an object literal. */
type OptionalKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? K : never;
}[keyof T];

/** True when every member of Fields is an optional key of T. */
type AllOptional<T, Fields extends keyof T> = [Fields] extends [OptionalKeys<T>] ? true : false;

/** True when A and B accept exactly the same values. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// 1. The four new fields on a details row are optional: a row serialised before
//    Label and Key is still a PositionDetailsDto.
export type DetailsKeysAreOptional = Assert<
  AllOptional<
    PositionDetailsDto,
    'workedInKeys' | 'soldToKeys' | 'workedInUnresolved' | 'soldToUnresolved'
  >
>;

// 2. The same for a job.
export type ProjectKeysAreOptional = Assert<
  AllOptional<RecruiterProjectDto, 'industryWorksInKeys' | 'industrySoldToKeys'>
>;

// 3. The estimator breakdown may omit the group entries: every stored estimate does.
export type GroupsAreOptional = Assert<AllOptional<OteIndustryAdjustment, 'groups'>>;

// 4. A key is exactly the resolver's shape, so the backend's own IndustryKey
//    interface and this DTO cannot drift apart without one of them failing here.
//    This pins the property set and the base types. It cannot pin the `| null`:
//    this package, and both apps, compile with strictNullChecks off, where
//    `string | null` and `string` are one type. A mutation that dropped the
//    null passed, so the null-ness is documentation, and this line is not
//    evidence for it.
export type KeyMatchesTheResolver = Assert<
  Same<IndustryKeyDto, { id: string; name: string; groupId: string | null; groupName: string | null }>
>;

// 5. A parsed CV still carries the single string every stored row has, and
//    may carry the array the new prompt returns, both optional.
type ParsedExperience = ParsedResume['workExperience'][number];
export type CvIndustryKeysAreOptional = Assert<
  AllOptional<ParsedExperience, 'industry' | 'industries'>
>;
export type CvIndustriesIsAnArray = Assert<
  Same<NonNullable<ParsedExperience['industries']>, string[]>
>;
export type CvIndustryIsStillAString = Assert<Same<NonNullable<ParsedExperience['industry']>, string>>;
