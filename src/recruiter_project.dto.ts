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