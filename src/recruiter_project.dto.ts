import { ProjectApplicationDto } from './project_application.dto';
import { RecruiterCompanyDto } from './recruiter_company';
import { UserDto } from './user.dto';

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
  isOteVisible: boolean;
  locationType: string | null;
  description: string | null;
  experienceType: string | null;
  location: string[] | null;
  existingBusinessRange: number | null;
  businessRange: number | null;
  partnershipRange: number | null;
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
  visitsCount: number;
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

export interface GetCandidatesResponseDto {
  error: boolean;
  message?: string;
  candidates?: UserDto[];
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
  isOteVisible: string;
  locationType: string | null;
  locationCategory: string | null;
  description: string | null;
  experienceType: string | null;
  location: string | null;
  existingBusinessRange: string | null;
  businessRange: string | null;
  partnershipRange: string | null;
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
  currencyCountry: string | null;
  isTravelRequirements: string | null;
  reportTo: string | null;
  hiringProcess: string | null;
  growthOpportunities: string | null;
  visitsCount: string;
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
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
