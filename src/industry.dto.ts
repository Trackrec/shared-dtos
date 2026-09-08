/**
 * LABEL AND KEY: the industry types both apps read.
 *
 * Victor approved the design 4-0 on 2026-09-01. One column used to do three
 * jobs: the words printed on a profile card, the string handed to a model to
 * score the industry FIT dimension, and the join key into the estimator's
 * multiplier. It cannot be both a person's own words and a comparison key, so
 * the two are split. The words stay forever as a label (the existing string
 * arrays on PositionDetailsDto and RecruiterProjectDto). The thing matching
 * runs on is a KEY: the id of a row on the canonical `industries` table, which
 * cannot be typed, only resolved.
 *
 * Everything here is what the API returns. Request payloads do not change:
 * pickers still send names, and the backend resolves them.
 *
 * Ids are strings. The tables are BIGINT and this codebase carries bigints as
 * strings in TypeScript everywhere else.
 */

/** Which side of a row a label sits on. Jobs say "works in", people say "worked in". */
export type IndustryRole = 'worked_in' | 'sold_to' | 'works_in';

/** Which door a link came through. The audit column on every link row. */
export type IndustryLinkSource =
  | 'picker'
  | 'barney'
  | 'resume'
  | 'apollo'
  | 'jd_parser'
  | 'admin'
  | 'migration';

/** Who wrote an alias: the checked-in seed, the consolidation migration, or a person in the admin screen. */
export type IndustryAliasSource = 'seed' | 'migration' | 'admin';

/** The two tables that carry industry labels. */
export type IndustryLabelSourceTable = 'position_details' | 'recruiter_project';

/**
 * Where a row's effective multiplier comes from.
 *
 * `override` is a value set on the row itself and wins. `group` is inherited
 * from the market group the row belongs to. `none` means the row has no group
 * and no override, so it contributes 0.
 */
export type IndustryMultiplierSource = 'override' | 'group' | 'none';

/**
 * A resolved industry: the key, and enough of the row to display and compare
 * it without another read.
 *
 * `groupId` and `groupName` are null for a row that has not been placed in a
 * market group. Scoring treats such a row as matching itself only.
 */
export interface IndustryKeyDto {
  id: string;
  name: string;
  groupId: string | null;
  groupName: string | null;
}

/**
 * A market group: roughly 18 of them, one row per group. Same group scores the
 * partial tier on industry FIT, and the group carries the multiplier its rows
 * inherit.
 *
 * `multiplier` is a percentage (7.5 means +7.5%). Null until the consolidation
 * migration has computed it from the live rows, and null again if an admin
 * clears it.
 */
export interface IndustryGroupDto {
  id: string;
  name: string;
  multiplier: number | null;
  /** How many industries sit in the group. Set by the list endpoint, absent elsewhere. */
  industryCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One row of the canonical list, as the admin screen sees it.
 *
 * The multiplier a person is priced on is `effectiveMultiplier`, and
 * `multiplierSource` says where it came from so the table can mark it "group"
 * or "override". `multiplier` is the legacy per-row value the column still
 * holds; it stays on the wire because the current admin table renders it, is
 * read by nothing else once the estimator prices by group, and the column is
 * renamed away in the retirement migration.
 */
export interface IndustryDto {
  id: string;
  name: string;
  groupId: string | null;
  groupName: string | null;
  /** Set on the row and wins over the group. Percentage, or null to inherit. */
  multiplierOverride: number | null;
  /** The group's multiplier, repeated here so the row can be shown without a join. */
  groupMultiplier: number | null;
  /** What the estimator uses: the override, else the group, else 0. Percentage. */
  effectiveMultiplier: number;
  multiplierSource: IndustryMultiplierSource;
  /** Legacy per-row value. See the interface comment. */
  multiplier: number | null;
  /**
   * False means retired. A retired row keeps every stored link valid and
   * still resolves through its alias; it is hidden from pickers and from
   * Barney's vocabulary, and nothing new links to it.
   */
  isActive: boolean;
  /**
   * How many position and project links point at the row. Set by the list
   * endpoint so the screen can offer Delete at 0 and Retire otherwise; absent
   * on search hits.
   */
  linkCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A spelling that means one of our rows. "saas" means Software Development;
 * Apollo's "marketing and advertising" means two rows and is two alias rows.
 *
 * `normalized` is the matching form (lowercase, "&" as "and", whitespace
 * collapsed), which is why it never carries capitals. `industryId` null is a
 * decision, not a gap: the string was seen, considered, and refused a
 * counterpart, so it stays a label that scores nothing and stops appearing in
 * the unmapped queue.
 */
export interface IndustryAliasDto {
  id: string;
  normalized: string;
  industryId: string | null;
  /** The target row's current name, for display. Null when refused. */
  industryName: string | null;
  note: string | null;
  source: IndustryAliasSource;
  createdAt: Date;
}

/**
 * One string the resolver could not place, grouped across every row that
 * carries it. This is what the admin "Unmapped" screen lists, and mapping one
 * writes an alias and relinks every affected row.
 */
export interface UnmappedLabelDto {
  /** The matching form the rows were grouped by. */
  normalized: string;
  /** How many (row, role) pairs carry it. */
  count: number;
  /** One of the labels as a person actually wrote it, for the screen. */
  sampleLabel: string;
  /** Which sides it was seen on. */
  roles: IndustryRole[];
  /**
   * True when an alias with no target exists for the string. The queue hides
   * refused strings by default and shows them on request.
   */
  refused: boolean;
  /** The most recent sighting, when the endpoint computes it. */
  lastSeenAt?: Date;
}

/**
 * One option from the industry search, the endpoint every picker calls.
 *
 * `name` is what the option shows and, when picked, what is stored as the
 * person's label. A plain hit is a canonical row. An alias hit carries
 * `resolvesTo`, so the option can read "SaaS (Software Development)", and its
 * `id` is the canonical row the alias points at. Aliases with no target are
 * never search hits: they are refusals, not options.
 */
export interface IndustrySearchHitDto {
  id: string;
  name: string;
  alias: boolean;
  resolvesTo?: string;
  groupId?: string | null;
  groupName?: string | null;
}
