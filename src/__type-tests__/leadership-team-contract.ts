/**
 * COMPILE-TIME ASSERTIONS FOR THE TEAM A LEADERSHIP JOB ASKS (TR-558). No
 * runtime, no runner: `tsc --noEmit` is the test, and a failing assertion is
 * a type error on the line that names it.
 *
 * WHAT THIS GUARDS. The three job fields are read by both apps under these
 * names (the job form posts them, the recruiter screens and the public job
 * page read them back), and the team axis is a criterion key the frontend's
 * weight control and radar must carry. These lines pin the names, keep the
 * fields optional so a job read before the columns is still a
 * RecruiterProjectDto, and pin the shared vocabulary to the list the backend
 * validates against, Sales development included. Same cannot pin `| null`:
 * this package and both apps compile with strictNullChecks off.
 */
import type { CriterionKey } from '../must-haves';
import type { MANAGED_TEAMS, ManagedTeam } from '../managed-teams';
import type { PointsDto } from '../project_application.dto';
import type { RecruiterProjectDto, RecruiterProjectRequestDto } from '../recruiter_project.dto';

type Assert<T extends true> = T;

/** The keys of T that may be left out of an object literal. */
type OptionalKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? K : never;
}[keyof T];

/** True when every member of Fields is an optional key of T. */
type AllOptional<T, Fields extends keyof T> = [Fields] extends [OptionalKeys<T>] ? true : false;

/** True when A and B accept exactly the same values. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// 1. The three job fields, by name, optional: a job saved before them still types.
export type TeamFieldsAreOptional = Assert<
  AllOptional<RecruiterProjectDto, 'teamDirectReports' | 'teamRollingUp' | 'teamManaged'>
>;

// 2. Two head counts and a list of team names.
export type TeamCountsAreNumbers = Assert<
  Same<NonNullable<RecruiterProjectDto['teamDirectReports' | 'teamRollingUp']>, number>
>;
export type TeamsManagedIsAList = Assert<
  Same<NonNullable<RecruiterProjectDto['teamManaged']>, string[]>
>;

// 2b. The form posts the same three names, as strings, and may leave them out.
export type TeamRequestFieldsAreOptional = Assert<
  AllOptional<RecruiterProjectRequestDto, 'teamDirectReports' | 'teamRollingUp' | 'teamManaged'>
>;
export type TeamRequestFieldsAreStrings = Assert<
  Same<
    NonNullable<RecruiterProjectRequestDto['teamDirectReports' | 'teamRollingUp' | 'teamManaged']>,
    string
  >
>;

// 3. The team axis is a criterion a recruiter can weigh, stored as pointsForTeam.
export type TeamIsACriterion = Assert<'team' extends CriterionKey ? true : false>;
export type PointsCarryTheTeam = Assert<AllOptional<PointsDto, 'pointsForTeam'>>;

// 4. The vocabulary carries Sales development, the BDR manager's team, among seven.
export type SalesDevelopmentIsATeam = Assert<'Sales development' extends ManagedTeam ? true : false>;
export type SevenTeams = Assert<Same<(typeof MANAGED_TEAMS)['length'], 7>>;
