import { RecruiterProjectDto } from './recruiter_project.dto';
import { UserDto } from './user.dto';

export interface RecruiterCompanyDto {
  id: number;
  companyName: string;
  logo: string;
  logoType: string;
  recruiters: RecruiterCompanyUserDto[];
  projects: RecruiterProjectDto[];
  createdBy: UserDto | null;
}

export interface RecruiterCompanyUserDto {
  id: number;
  user: UserDto;
  company: RecruiterCompanyDto;
}

export interface CreateRecruiterCompanyRequestDto {
  companyName: string;
}

export interface UpdateRecruiterCompanyRequestDto {
  companyName?: string;
}

export interface RecruiterCompanyParamDto {
  id: number;
}
