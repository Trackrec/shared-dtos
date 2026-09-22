/**
 * COMPILE-TIME ASSERTIONS FOR THE PRODUCT SPLIT ON A PARSED CV. No runtime, no
 * runner: `tsc --noEmit` is the test, and a failing assertion is a type error on
 * the line that names it.
 *
 * WHAT THIS GUARDS. The backend read productSplit through a local intersection
 * (resume-parser.service.ts, ParsedExperience) before this package carried the
 * key. These lines pin the key optional, so a row serialised before it is still
 * a ParsedResume and both apps compile at the pointer move, and pin its shape to
 * the three shares the backend writes, so the intersection can go and nothing
 * drifts. Same cannot pin `| null`: this package and both apps compile with
 * strictNullChecks off, where `number | null` and `number` are one type.
 */
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

type ParsedExperience = ParsedResume['workExperience'][number];

// 1. A row parsed before the key is still a ParsedResume.
export type ProductSplitIsOptional = Assert<AllOptional<ParsedExperience, 'productSplit'>>;

// 2. Exactly the three shares the backend writes to the details row, each required
//    inside the object, so a model answer missing one is a type error where it is read.
export type ProductSplitHasThreeShares = Assert<
  Same<
    NonNullable<ParsedExperience['productSplit']>,
    { software: number; service: number; hardware: number }
  >
>;

// 3. It sits beside segmentSplit under the same discipline, whole numbers of one
//    hundred; this line keeps the neighbour it was modelled on from drifting.
export type SegmentSplitStillHasThreeShares = Assert<
  Same<
    NonNullable<ParsedExperience['segmentSplit']>,
    { smb: number; midMarket: number; enterprise: number }
  >
>;
