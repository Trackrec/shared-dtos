import { PointsDto, ProjectApplicationDto } from './project_application.dto';
import { RecruiterCompanyDto } from './recruiter_company';
import { UserDto } from './user.dto';

export enum LocationType {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

export enum ScoringContext {
  Suggested = 'suggested',
  Applicant = 'applicant',
}

export enum ExperienceType {
  INDIVIDUAL_CONTRIBUTOR = 'Individual contributor',
  LEADERSHIP = 'Leadership',
  BDR = 'BDR',
}

export enum ExperienceFilter {
  ONE = 'one', // Last 1 year
  TWO = 'two', // Last 2 years
  THREE = 'three', // Last 3 years
  FIVE = 'five', // Last 5 years
  FIVE_PLUS = 'fivePlus', // More than 5 years
}

export enum ProductTypePreference {
  ANY = 'any',
  SOFTWARE = 'software',
  HARDWARE = 'hardware',
  SERVICES = 'services',
}

export enum ProductTypePreferenceWeight {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
export interface RecruiterProjectDto {
  id: number;
  title: string;
  projectTitle: string;
  companyName: string | null;
  logo: string | null;
  logoType: string | null;
  experience: number | null;
  oteStart: number | null;
  oteEnd: number | null;
  commissionSplit: number | null;
  baseSplit: number | null;
  isOteVisible: boolean;
  locationType: LocationType | null;
  description: string | null;
  experienceType: ExperienceType | null;
  location: string[] | null;
  existingBusinessRange: number | null;
  businessRange: number | null;
  partnershipRange: number | null;
  softwareProductType: number | null;
  hardwareProductType: number | null;
  serviceProductType: number | null;
  inboundRange: number | null;
  outboundRange: number | null;
  smb: number | null;
  midmarket: number | null;
  enterprise: number | null;
  minimumDealSize: number | null;
  minimumSaleCycle: number | null;
  hybridDays: number | null;
  industryWorksIn: string[] | null;
  industrySoldTo: string[] | null;
  selectedPersona: string[] | null;
  territory: string[] | null;
  languages: string[] | null;
  linkedinProfile: string | null;
  minimumSalecycleType: string | null;
  timeline: string | null;
  benefits: string | null;
  elevatorPitch: string | null;
  officeAddress: string | null;
  officeAddressId: string | null;
  travelRequirementPercentage: string | null;
  startDate: Date | null;
  currency: string | null;
  currencyCountry: string | null;
  isTravelRequirements: boolean | null;
  reportTo: string | null;
  hiringProcess: string | null;
  growthOpportunities: string | null;
  projectCustomUrl: string | null;
  companyId: string | null;
  draft: boolean;
  published: boolean;
  companyElevatorPitch: string | null;
  mainProblem: string | null;
  user: UserDto | null;
  createdAt: Date;
  updatedAt: Date;
  applications: ProjectApplicationDto[];
  company: RecruiterCompanyDto | null;
  coefficients?: {
    ote: number;
    location: number;
    experience: number;
    businessMix: number;
    leadSource: number;
    dealSize: number;
    salesCycle: number;
    segment: number;
    territory: number;
    industryWorksIn: number;
    industrySoldTo: number;
    persona: number;
    companyOverlap: number;
  };

  /**
   * How many people are attached to this job, for the Open positions list.
   *
   * With application emails parked, the list is the only place a recruiter can
   * learn that anybody applied, and it showed nothing. Set by findAll through
   * subqueries; absent on every other path that returns a project, hence
   * optional.
   */
  applicationsCount?: number;
  /** Applications still PENDING, which is what "new" means to a recruiter. */
  pendingApplicationsCount?: number;
  /** Suggested candidates not yet rejected by the recruiter. */
  suggestedCount?: number;
}

export interface CheckAppliedResponseDto {
  error: boolean;
  message?: string;
  applied?: boolean;
}

export type CandidateListItemDto = Pick<UserDto,
  | 'id'
  | 'fullName'
  | 'profileImage'
  | 'publicProfileUsername'
  | 'customCurrentRole'
  | 'jobHopperStatus'
  | 'jobHopperExplanation'
  | 'shortStintsCount'
  | 'currentTenureMonths'
>;

export interface GetCandidatesResponseDto {
  error: boolean;
  message?: string;
  candidates?: CandidateListItemDto[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ProjectListResponseDto {
  error: boolean;
  message?: string;
  projects?: RecruiterProjectDto[];
}

export interface AllUsersProjectsResponseDto {
  error: boolean;
  message?: string;
  projects?: RecruiterProjectDto[];
}

/**
 * WHAT A CANDIDATE MAY SEE OF THE COMPANY BEHIND A POST.
 *
 * Built by the backend from the recruiter company's brand columns and nothing
 * else: the row's Stripe identifiers and seat counts never reach this shape.
 * Null on a cover post (useAnotherCompanyName), where the recruiter's company
 * must not appear beside the cover identity.
 *
 * `name`, `logoUrl` and `websiteUrl` describe the POSTING company. When the
 * post is about that company too (its companyName equals the company's, trimmed
 * and case-folded) `tagline` and `accentColor` are present as well, null when
 * the admin has not set them. When an agency posts transparently for a client
 * the two keys are ABSENT: the client's own name and logo stay on the post, and
 * the agency's tagline and colour do not decorate it. So merge this over the
 * post's own companyName and logo only when `name` matches the post's
 * companyName; otherwise show it as who posted the job.
 */
export interface PublicBrandDto {
  name: string | null;
  /** Absolute. The company logo lives under its own bucket prefix; this is already resolved. */
  logoUrl: string | null;
  websiteUrl: string | null;
  tagline?: string | null;
  /** #RRGGBB, for identity surfaces only. Never on Apply, focus rings or text. */
  accentColor?: string | null;
}

export interface ProjectResponseDto {
  error: boolean;
  message?: string;
  project?: RecruiterProjectDto;
  /**
   * The brand of the company behind the post, on the candidate-facing read
   * (project-view by URL). Null on a cover post or when the post has no
   * company; absent on recruiter-side reads, which get the company itself.
   */
  brand?: PublicBrandDto | null;
  /**
   * The edit saved AND took the job offline.
   *
   * An update to a published project whose result no longer passes
   * hasRequiredFields demotes it to a draft. That used to return a plain
   * success, so the edit page said "Job updated successfully!" and navigated
   * away while the job had stopped being visible to candidates.
   */
  unpublished?: boolean;
  /** What to fill in to put it back, in the recruiter's own words. */
  missingFields?: string[];
}

export interface ProjectVisitorsDto {
  id: number;
  project: RecruiterProjectDto;
  user: UserDto;
}

export interface CreateProjectVisitorRequestDto {
  projectId: number;
}

export interface CreateProjectVisitorResponseDto {
  error?: boolean;
  message?: string;
  position?: ProjectVisitorsDto;
}

export interface ProjectVisitorsCountResponseDto {
  error?: boolean;
  message?: string;
  data?: number;
}

export interface RecruiterProjectRequestDto {
  id: string;
  title: string;
  projectTitle: string;
  companyName: string | null;
  logo: string | null;
  logoType: string | null;
  experience: string | null;
  oteStart: string | null;
  oteEnd: string | null;
  commissionSplit: string | null;
  baseSplit: string | null;
  isOteVisible: string;
  isEquityAvailable: string;
  locationType: LocationType | null;
  locationCategory: string | null;
  description: string | null;
  experienceType: ExperienceType | null;
  location: string | null;
  existingBusinessRange: string | null;
  businessRange: string | null;
  partnershipRange: string | null;
  software: string | null;
  hardware: string | null;
  service: string | null;
  productTypePreference: ProductTypePreference | null;
  productTypePreferenceWeight: ProductTypePreferenceWeight | null;
  inboundRange: string | null;
  outboundRange: string | null;
  smb: string | null;
  midmarket: string | null;
  enterprise: string | null;
  minimumDealSize: string | null;
  minimumSaleCycle: string | null;
  hybridDays: string | null;
  industryWorksIn: string | null;
  industrySoldTo: string | null;
  selectedPersona: string | null;
  territory: string | null;
  languages: string | null;
  linkedinProfile: string | null;
  minimumSalecycleType: string | null;
  timeline: string | null;
  benefits: string | null;
  elevatorPitch: string | null;
  officeAddress: string | null;
  officeAddressId: string | null;
  travelRequirementPercentage: string | null;
  startDate: string | null;
  currency: string | null;
  visitsCount: string | null;
  currencyCountry: string | null;
  isTravelRequirements: string | null;
  reportTo: string | null;
  hiringProcess: string | null;
  growthOpportunities: string | null;
  projectCustomUrl: string | null;
  companyId: string | null;
  draft: string;
  published: string;
  companyElevatorPitch: string | null;
  mainProblem: string | null;
  user: string | null;
  createdAt: string;
  updatedAt: string;
  applications: string;
  company: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  domain: string | null;
  companyLogoUrl: string | null;
  companyWebsiteUrl: string | null;
  companyDomain: string | null;
  companyOverlapUrl: string | null;
  coefficients?: {
    ote: number;
    location: number;
    experience: number;
    businessMix: number;
    leadSource: number;
    dealSize: number;
    salesCycle: number;
    segment: number;
    territory: number;
    industryWorksIn: number;
    industrySoldTo: number;
    persona: number;
    companyOverlap: number;
  };
  experienceFilter: ExperienceFilter | null;
  useInternalTitle: string;
  useAnotherCompanyName: string;
  locationCityId: string | null;

  companySizeMin: string | null;
  companySizeMax: string | null;
  companySizeScope: 'current' | 'recent_3_years' | 'all' | null;
}

export interface ProjectVisitorParamDto {
  projectId: number;
}

export interface ProjectIdQueryDto {
  projectId: number;
}

export interface CandidatesListQueryDto {
  page?: number;
  limit?: number;
  /** When true, exclude candidates with YELLOW or RED job hopper status */
  hideJobHoppers?: boolean;
}

export interface ProjectListQueryDto {
  page?: number;
  limit?: number;
  title?: string;
  startDate?: string;
  status?: 'published' | 'draft';
  ref?: number;
}

export interface ProjectViewByUrlParamDto {
  projectUrl: string;
}

export interface ProjectByIdParamDto {
  id: number;
}

export interface ProjectRankingQueryDto {
  minExperience?: string;
  companySizeMin?: number;
  companySizeMax?: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ProjectWithUser {
  user: UserDto;
  project: RecruiterProjectDto;
}

export interface SuggestedCandidateDto {
  user: {
    id: number;
    fullName: string;
    publicProfileUsername: string;
    customCurrentRole: string;
    profileImage: string;
    points: { points: Partial<PointsDto>; percentage: number };
  };
}

export interface SuggestedCandidatesResponseDto {
  error: boolean;
  candidates: SuggestedCandidateDto[];
  total: number;
  page: number;
  limit: number;
}

// OTE Estimation for Job Postings (Market Fit)
export interface EstimateOteRequestDto {
  experienceType: string; // "individual_contributor" | "leadership" | "bdr"
  experience: number; // years of experience
  locations: string[]; // e.g., ["San Francisco, CA"]
  segment?: {
    smb?: number;
    midMarket?: number;
    enterprise?: number;
  };
  dealSize?: number; // avg deal size in USD
  newBusinessPct?: number; // percentage (0-100)
  outboundPct?: number; // percentage (0-100)
  industryWorksIn?: string[]; // e.g., ["SaaS", "Cybersecurity"]
  currency?: string; // "USD" | "CAD"
}

export interface EstimateOteResponseDto {
  low: number;
  mid: number;
  high: number;
  role: string; // e.g., "AE_ENTERPRISE"
  tierLabel: string; // e.g., "Tier 1 (San Francisco)"
  split: {
    base: number; // percentage
    variable: number; // percentage
  };
  confidence: string; // "high" | "medium" | "low"
  currency: string; // "USD" | "CAD"

  /**
   * Locations on the job that could not be priced, by name.
   *
   * The estimator covers the United States and Canada. A job naming a city
   * outside both used to have that city dropped in a bare `continue`, and the
   * remaining city's range was returned as the answer for the whole job with
   * nothing to say a location had been left out.
   *
   * Optional because the common case is that nothing was skipped, and because
   * every existing caller predates the field.
   */
  skippedLocations?: string[];
}

/*
 * SUPPLY: HOW MANY SELLERS ON TRACKREC CLEAR A JOB'S FLOORS, AS A WORD.
 *
 * Victor, on showing recruiters the size of the pool: "I don't want people to
 * realize that we don't have that many users right now. So we can maybe not
 * give precise numbers, but we can say high, mid, low." So the answer to
 * "how many clear this floor" is one of three words and never a count. The
 * response type below carries no numeric field on purpose, and a test on the
 * backend serialises it and asserts that no digit appears anywhere in it.
 *
 * The bands are RELATIVE to the pool, so they stay true as the product grows:
 * high means at least three sellers in ten clear the floor, low means fewer
 * than one in ten, mid is everything between. The thresholds are named
 * constants in the backend (supply-bands.ts).
 */
export type SupplyBand = 'high' | 'mid' | 'low';

/**
 * The draft job's floors, as the form holds them while the recruiter types.
 *
 * Every floor is optional because the recruiter fills the form in whatever
 * order they like, and the chips answer for whatever is filled in so far. A
 * blank floor comes back as null, so the chip beside it stays hidden.
 */
export interface SupplyRequestDto {
  /** Minimum average deal size, in `currency`. */
  minimumDealSize?: number | null;
  /** ISO code of the currency the job is posted in, e.g. 'USD'. Defaults to USD. */
  currency?: string;
  /** Minimum average sales cycle, in `minimumSalecycleType` units. */
  minimumSaleCycle?: number | null;
  /** 'Months', 'Weeks' or 'Less than a month', as the form's picker holds it. */
  minimumSalecycleType?: string | null;
  /** Minimum years of sales experience. */
  experience?: number | null;
  /** The segment split the job asks for, in percentages. */
  segment?: {
    smb?: number | null;
    midMarket?: number | null;
    enterprise?: number | null;
  };
}

/**
 * One band per floor, and one for the intersection of every floor that is set.
 *
 * null means the floor was blank, so there is nothing to clear. There is no
 * count, no percentage and no pool size here, and there must never be one.
 */
export interface SupplyResponseDto {
  dealSize: SupplyBand | null;
  salesCycle: SupplyBand | null;
  experience: SupplyBand | null;
  segment: SupplyBand | null;
  /** Sellers who clear every floor that is set at once. */
  overall: SupplyBand | null;
}
