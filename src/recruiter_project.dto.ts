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
  ONE = 'one',          // Last 1 year
  TWO = 'two',          // Last 2 years
  THREE = 'three',      // Last 3 years
  FIVE = 'five',        // Last 5 years
  FIVE_PLUS = 'fivePlus', // More than 5 years
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

export interface ProjectResponseDto {
  error: boolean;
  message?: string;
  project?: RecruiterProjectDto;
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
}
