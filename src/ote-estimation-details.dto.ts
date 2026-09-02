/**
 * OTE Estimation Details DTO
 *
 * Shared type definition for the estimatedOteDetails JSON stored in the database.
 * Used by both backend (ote-estimator.listener.ts) and frontend (types.ts).
 *
 * Last Updated: 2026-01-26
 */

// =============================================================================
// ENUMS & LITERAL TYPES
// =============================================================================

export type OteStatus = 'calculated' | 'skipped';

export type OteSkipCode =
  | 'unsupported_country'
  | 'insufficient_experience'
  | 'only_non_sales_positions'
  | 'no_ic_positions'
  | 'no_completed_ic_positions'
  | 'stale_data'
  | 'recent_leadership_only'
  | 'no_bdr_positions'
  | 'no_completed_bdr_positions';

export type Segment = 'SMB' | 'MidMarket' | 'Enterprise' | 'Strategic';
export type SegmentSource = 'declared' | 'inferred' | 'defaulted';

export type LocationTier = 'Tier1' | 'Tier2' | 'Tier3' | 'Tier4';
export type CountryCode = 'CA' | 'US';
export type Currency = 'USD' | 'CAD';

/**
 * SIX BANDS. `principal` is over twenty years, added 2026-09-01.
 *
 * The curve used to stop at `veteran` for 10+ with nothing above it, and
 * effective years were capped at 20, so a 12-year seller and a 31-year seller
 * were the same number by construction. Measured on production, the over-20
 * group earns 12 to 14% more than the 10-to-20 group on both definitions of
 * tenure, so the model could not express a difference that is really there.
 *
 * ANY CONSUMER KEYED ON BAND NAME NEEDS AN ENTRY FOR THIS. The frontend keys its
 * explanation copy off this union, and a band with no copy silently renders the
 * empty state, which reads as the estimate having failed.
 */
export type ExperienceBandName =
  | 'entry'
  | 'early'
  | 'mid'
  | 'senior'
  | 'veteran'
  | 'principal';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type RoleTitle =
  | 'AE_SMB'
  | 'AE_MID_MARKET'
  | 'AE_ENTERPRISE'
  | 'AE_STRATEGIC'
  | 'AM';

export type ProductType = 'software' | 'services' | 'hardware' | 'real_estate';
export type IndustryModifierType = 'hot' | 'commodity' | 'none';

// =============================================================================
// SKIP REASON (when status = 'skipped')
// =============================================================================

export interface OteSkipReason {
  code: OteSkipCode;
  message?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// CALCULATION COMPONENTS (when status = 'calculated')
// =============================================================================

/**
 * Baseline OTE before modifiers
 */
export interface OteBaseline {
  tier3Baseline: number;    // Tier3 baseline before geographic adjustment (e.g., $210,000)
  tier: LocationTier;       // Geographic tier (Tier1, Tier2, Tier3, Tier4)
  multiplier: number;       // Geographic tier multiplier (1.2, 1.1, 1.0, 0.9)
  finalAmount: number;      // After geographic adjustment (tier3Baseline × multiplier)
}

/**
 * Experience band adjustment
 */
export interface OteExperienceBand {
  years: number;            // Effective years for calculation
  // entry (<2y), early (2-3y), mid (3-5y), senior (5-10y), veteran (10-20y),
  // principal (>20y)
  band: ExperienceBandName;
  // 0.80, 0.90, 1.00, 1.11, 1.29, 1.45. The upper three are measured medians
  // from production rather than chosen figures.
  multiplier: number;
  icYears?: number;         // Raw IC years from positions
  leadershipYears?: number; // Raw leadership years from positions
}

/**
 * Individual modifier (applied or not)
 */
export interface OteModifierApplied {
  applied: boolean;
  value: number;  // 0 if not applied, otherwise the modifier value (e.g., 0.075)
}

/**
 * Industry modifier with type discriminator
 */
export interface OteIndustryModifier {
  type: IndustryModifierType;
  value: number;  // +0.075 for hot, -0.10 for commodity, 0 for none
}

/**
 * All modifiers applied to OTE
 */
export interface OteModifiers {
  bigLogo: OteModifierApplied;    // +7.5% for 1000+ employee companies
  outbound: OteModifierApplied;   // +10% for >50% outbound focus
  industry: OteIndustryModifier;  // +7.5% hot, -10% commodity
  combined: number;               // Total multiplier (e.g., 1.175 for +17.5%)
}

/**
 * Base/variable compensation split
 */
export interface OteCompensationSplit {
  base: number;
  variable: number;
  total: number;
}

/**
 * Final OTE estimate with confidence
 */
export interface OteFinal {
  amount: number;            // Primary display value (= mid)
  low: number;               // Low end of confidence range
  mid: number;               // Mid-point estimate
  high: number;              // High end of confidence range
  currency: Currency;
  confidence: ConfidenceLevel;
  band: string;              // e.g., "7.5%", "10%", "20%"
}

/**
 * Segment classification
 */
export interface OteSegment {
  value: Segment;
  source: SegmentSource;
}

/**
 * Segment reconciliation when stated ≠ inferred
 */
export interface OteSegmentReconciliation {
  stated?: Segment;
  inferred: Segment;
  modifier: number;
  reason?: string;
}

/**
 * Location details
 */
export interface OteLocation {
  city?: string;
  country?: CountryCode;
  tier: LocationTier;
  tierMultiplier: number;
}

/**
 * Confidence factors breakdown
 */
export interface OteConfidenceFactors {
  score: number;              // 30-95
  missingDealSize: boolean;
  missingNewPct: boolean;
  missingOutboundPct: boolean;
  missingYearsIc: boolean;
  missingSegment: boolean;
}

/**
 * Weighted deal size for high-variance candidates
 */
export interface OteWeightedDealSize {
  avg: number;
  max: number;
  weighted: number;
}

/**
 * Industry-specific adjustment
 */
export interface OteIndustryAdjustment {
  industries: string[];
  multiplier: number;  // percentage, e.g., 7.5 for +7.5%
}

/**
 * Calculation steps for debugging/admin view
 */
export interface OteCalculationSteps {
  afterBaseline: number;
  afterModifiers: number;
  afterIndustry: number;
  afterSegmentReconciliation: number;
  afterExperience: number;
  final: number;
}

// =============================================================================
// LEGACY SUPPORT
// =============================================================================

/**
 * Legacy modifier format (array of objects)
 * @deprecated Use OteModifiers instead
 */
export interface OteModifierLegacy {
  type?: string;
  impact?: number;
  description?: string;
}

// =============================================================================
// MAIN DTO
// =============================================================================

/**
 * OTE Estimation Details
 *
 * This is the structure stored in accounts_users.estimated_ote_details JSON column.
 * It contains either:
 * - status: 'calculated' with full calculation breakdown, OR
 * - status: 'skipped' with reasons why OTE couldn't be calculated
 */
export interface OteEstimationDetailsDto {
  /** Schema version for future migrations. Increment on breaking changes. */
  __schemaVersion?: 1;

  status: OteStatus;
  calculationDate?: string;  // ISO 8601 timestamp
  positionsAnalyzed?: number;

  // Skip case
  reasons?: OteSkipReason[];

  // Calculated case - core fields
  role?: RoleTitle;
  baseline?: OteBaseline;
  experienceBand?: OteExperienceBand;
  modifiers?: OteModifiers | OteModifierLegacy[];  // Support both formats
  compensationSplit?: OteCompensationSplit;
  finalOte?: OteFinal;

  // Calculated case - context fields
  segment?: OteSegment;
  segmentReconciliation?: OteSegmentReconciliation;
  location?: OteLocation;
  dealSize?: number;
  weightedDealSize?: OteWeightedDealSize;
  newBusinessPct?: number;
  existingBusinessPct?: number;
  positionTitles?: string[];

  // Calculated case - metadata
  productType?: ProductType;
  industryAdjustment?: OteIndustryAdjustment;
  confidenceFactors?: OteConfidenceFactors;
  calculationSteps?: OteCalculationSteps;

  /**
   * Employee count at the current company, when the enrichment had one.
   *
   * The calculator already reads this (it is what sets the big logo modifier,
   * at 1,000 and up) and it was dropped on the way out, so a stored row could
   * say somebody works for a big name and could not say that somebody works for
   * a fifteen-person team. Kept because the explanation says "for a small team"
   * when it knows, and that cannot be recovered from the modifier: the flag is
   * one bit and it is false for everybody under 1,000.
   */
  companySize?: number;

  // Debug/admin
  rationale?: string[];
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if modifiers are in the new structured format
 */
export function isStructuredModifiers(
  modifiers: OteModifiers | OteModifierLegacy[] | undefined
): modifiers is OteModifiers {
  if (!modifiers) return false;
  if (Array.isArray(modifiers)) return false;
  return 'bigLogo' in modifiers && 'outbound' in modifiers && 'industry' in modifiers;
}

/**
 * Check if OTE was calculated (vs skipped)
 */
export function isOteCalculated(
  details: OteEstimationDetailsDto | null | undefined
): details is OteEstimationDetailsDto & { status: 'calculated' } {
  return details?.status === 'calculated';
}

/**
 * Check if OTE was skipped
 */
export function isOteSkipped(
  details: OteEstimationDetailsDto | null | undefined
): details is OteEstimationDetailsDto & { status: 'skipped' } {
  return details?.status === 'skipped';
}


export interface OteModifiersStructured {
  bigLogo: OteModifierApplied;
  outbound: OteModifierApplied;
  industry: OteIndustryModifier;
  combined: number;  // total multiplier (e.g., 1.175 for +17.5%)
}