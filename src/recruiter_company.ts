import { RecruiterProjectDto } from "./recruiter_project.dto";
import { UserDto } from "./user.dto";

export interface RecruiterCompanyDto {
    id: number;
    company_name: string;
    logo: string;
    logo_type: string;
    recruiters: RecruiterCompanyUserDto[];
    projects: RecruiterProjectDto[];
    created_by: UserDto | null;
  }
  

  export interface RecruiterCompanyUserDto {
    id: number;
    user: UserDto; 
    company: RecruiterCompanyDto; 
  }
  