import { PositionDto } from './position.dto';
import { RecruiterCompanyDto } from './recruiter_company';

export interface CompanyDto {
  id: string;
  name: string;
  company_id: string | null;
  domain: string | null;
  logo_url: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  created_at: Date;
  updated_at: Date;
  positions: PositionDto[];
}

export interface CompanyDataDto {
  company_id: string | null;
  company_name: string;
  logo_url?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  domain?: string | null;
  company_logo_url?: string | null;
  company_website_url?: string | null;
  company_domain?: string | null;
}

export interface CompanyCreateResponseDto {
  error: boolean;
  message?: string;
  createdCompany?: CompanyDto;
}

export interface CompaniesListDto {
  error: boolean;
  message?: string;
  companies?: CompanyDto[];
}

export interface CompanyUpdateResponseDto {
  error: boolean;
  message?: string;
  updatedCompany?: CompanyDto;
}

export interface CompanyByIdDto {
  error: boolean;
  message?: string;
  company?: CompanyDto;
}

export interface CreateRecruiterCompanyDto {
  error: boolean;
  message: string;
  company?: RecruiterCompanyDto;
}

export interface CreateRecruiterCompanyResponseDto {
  error: boolean;
  company?: CreateRecruiterCompanyDto;
  message?: string;
}

export interface UpdateRecruiterCompanyDto {
  error: boolean;
  message?: string;
  company?: RecruiterCompanyDto;
}

export interface UpdateRecruiterCompanyResponseDto {
  error: boolean;
  message?: string;
  company?: UpdateRecruiterCompanyDto;
}

export interface CompanyByIdParamDto {
  id: string;
}

export interface SearchCompanyParamDto {
  company_name: string;
}
