import { CompanyDto } from "./company.dto";
import { PositionDetailsDto } from "./position_detail.dto";
import { UserDto } from "./user.dto";

export interface PositionDto {
  id: number; 
  start_month: number | null;
  start_year: number | null;
  end_month: number | null;
  end_year: number | null;
  role: string;
  user: UserDto;
  alternative_brand_icon_url: string | null;
  company: CompanyDto; 
  details: PositionDetailsDto | null; 
  verify_request: VerifyPositionDto[]; 
}


export interface PositionRequestDto{
   company_id: string,
   company_name: string,
   end_month: number,
   end_year: number,
   start_month: number,
   start_year: number, 
   logo_url: string | null,
   role: string,
   website_url: string | null,
   working_here: boolean,
   domain: string | null
}

export interface PositionWithCompany {
      start_month: number;
      start_year: number;
      end_month: number;
      end_year: number;
      role: string;
      user: {
        location_preferences: string[];
        id: number;
      };
      company: {
        name: string;
        logo_url: string;
        domain: string | null;
        id: string;
        company_id: string;
      };
      alternative_brand_icon_url: string | null;
      id: number;
    };

  
  export interface RecentYearPositionFilterDto {
      one: number;
      two: number;
      three: number;
      four: number;
      five: number;
      five_plus: null;
    }
    
    export interface VerifyPositionDto {
      id: number; 
      email: string;
      role: string | null;
      first_name: string | null;
      last_name: string | null;
      requestBy: UserDto; 
      position: PositionDto; 
      user: UserDto | null; 
      unique_token: string;
      status: string; 
      created_at: Date;
      updated_at: Date;
    }

export interface VerifyPositionRequestDto{
    email: string;
    first_name: string;
    last_name: string;
    positionId: number;
    requestBy: number;
    role: string
}

export interface ChangeVerificationRequestDto{
  request_id: number,
  status: string
}

export interface ExtendedVerifyPositionDto extends VerifyPositionDto {
  position: {
    is_completed: boolean;
    completion_percentage: number;
  } & PositionDto;
}

export interface VerifyRequestsResponseDto{
  error: boolean;
  message?: string;
  requests?: ExtendedVerifyPositionDto[]
}


export interface PostionResponseDto{
  error: boolean; 
  message?:string
  position?: PositionDto;
}

export interface AllPositionsByUserIdResponseDto{
  error: boolean;
  message?: string;
  positions?: PositionDto[]
}