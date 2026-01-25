/**
 * OTE Estimation Details DTO
 *
 * Shared type definition for the estimatedOteDetails JSON stored in the database.
 * Used by both backend (ote-estimator.listener.ts) and frontend (types.ts).
 *
 * Last Updated: 2025-01-25
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
  | 'recent_leadership_only';

export type Segment = 'SMB' | 'MidMarket' | 'Enterprise' | 'Strategic';
export type SegmentSource = 'declared' | 'inferred' | 'defaulted';

export type LocationTier = 'Tier1' | 'Tier2' | 'Tier3' | 'Tier4';
export type CountryCode = 'CA' | 'US';
export type Currency = 'USD' | 'CAD';

export type ExperienceBandName = 'entry' | 'early' | 'mid' | 'senior' | 'veteran';
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
  band: ExperienceBandName; // entry (0-1y), early (2-3y), mid (3-5y), senior (5-10y), veteran (10+y)
  multiplier: number;       // 0.85, 0.95, 1.0, 1.05, 1.1
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
