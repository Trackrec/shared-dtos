import { ProjectApplicationDto } from "./project_application.dto";
import { RecruiterCompanyDto } from "./recruiter_company";
import { UserDto } from "./user.dto";

export interface RecruiterProjectDto {
    id: number;
    title: string;
    company_name: string | null;
    logo: string | null;
    logo_type: string | null;
    experience: number | null;
    ote_start: number | null;
    ote_end: number | null;
    is_ote_visible: boolean;
    location_type: string | null;
    description: string | null;
    experience_type: string | null;
    location: string[] | null;
    existing_business_range: number | null;
    business_range: number | null;
    partnership_range: number | null;
    inbound_range: number | null;
    outbound_range: number | null;
    smb: number | null;
    midmarket: number | null;
    enterprise: number | null;
    minimum_deal_size: number | null;
    minimum_sale_cycle: number | null;
    hybrid_days: number | null;
    Industry_Works_IN: string[] | null;
    Industry_Sold_To: string[] | null;
    selectedPersona: string[] | null;
    territory: string[] | null;
    languages: string[] | null;
    linkedin_profile: string | null;
    minimum_salecycle_type: string | null;
    timeline: string | null;
    benefits: string | null;
    elevator_pitch: string | null;
    office_address: string | null;
    travel_requirement_percentage: string | null;
    start_date: Date | null;
    currency: string | null;
    currency_country: string | null;
    is_travel_requirements: boolean | null;
    report_to: string | null;
    hiring_process: string | null;
    growth_opportunities: string | null;
    visits_count: number;
    project_custom_url: string | null;
    company_id: string | null;
    draft: boolean;
    published: boolean;
    company_elevator_pitch: string | null;
    main_problem: string | null;
    user: UserDto | null; 
    created_at: Date;
    updated_at: Date;
    applications: ProjectApplicationDto[]; 
    company: RecruiterCompanyDto | null; 
  }
  
  export interface CheckAppliedResponseDto{
    error: boolean, message?: string, Applied?: boolean
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
  

  export interface ProjectResponseDto{
    error: boolean;
    message?: string;
    project?: RecruiterProjectDto
  }

  export interface ProjectVisitorsDto {
    id: number; 
    project: RecruiterProjectDto;
    user: UserDto;
  }

  export interface CreateProjectVisitorRequestDto{
    project_id: number
  }

  export interface CreateProjectVisitorResponseDto{
    error: boolean;
    message?: string;
    position?: ProjectVisitorsDto
  }

export interface ProjectVisitorsCountResponseDto{
  error: boolean;
  message?: string;
  data?: number
}


export interface RecruiterProjectRequestDto {
  id: string;
  title: string;
  company_name: string | null;
  logo: string | null;
  logo_type: string | null;
  experience: string | null;
  ote_start: string | null;
  ote_end: string | null;
  is_ote_visible: string; 
  location_type: string | null;
  description: string | null;
  experience_type: string | null;
  location: string | null; 
  existing_business_range: string | null;
  business_range: string | null;
  partnership_range: string | null;
  inbound_range: string | null;
  outbound_range: string | null;
  smb: string | null;
  midmarket: string | null;
  enterprise: string | null;
  minimum_deal_size: string | null;
  minimum_sale_cycle: string | null;
  hybrid_days: string | null;
  Industry_Works_IN: string | null;
  Industry_Sold_To: string | null; 
  selectedPersona: string | null; 
  territory: string | null; 
  languages: string | null; 
  linkedin_profile: string | null;
  minimum_salecycle_type: string | null;
  timeline: string | null;
  benefits: string | null;
  elevator_pitch: string | null;
  office_address: string | null;
  travel_requirement_percentage: string | null;
  start_date: string | null; 
  currency: string | null;
  currency_country: string | null;
  is_travel_requirements: string | null; 
  report_to: string | null;
  hiring_process: string | null;
  growth_opportunities: string | null;
  visits_count: string;
  project_custom_url: string | null;
  company_id: string | null;
  draft: string;
  published: string; 
  company_elevator_pitch: string | null;
  main_problem: string | null;
  user: string | null; 
  created_at: string; 
  updated_at: string;
  applications: string; 
  company: string | null; 
  logo_url: string | null;
  website_url: string | null;
  domain: string | null;
  company_logo_url: string | null; 
  company_website_url: string | null; 
  company_domain: string | null;
}


export interface ProjectVisitorParamDto{
  projectId: number
}

export interface ProjectIdQueryDto{
  project_id: number
}

export interface CandidatesListQueryDto{
  page?: number;
  limit?: number
}

export interface ProjectListQueryDto {
  page?: number;
  limit?: number;
  title?: string; 
  startDate?: string;
  status?: 'published' | 'draft';
  ref?: number;
}

export interface ProjectViewByUrlParamDto{
  project_url: string
}

export interface ProjectByIdParamDto{
  id: number
}

export interface ProjectRankingQueryDto{
  min_experience?: string
}