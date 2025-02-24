import { PositionDto } from './position.dto';
import { RecruiterCompanyDto } from './recruiter_company';

export interface CompanyDto {
  id: string;
  name: string;
  companyId: string | null;
  domain: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  positions: PositionDto[];
}

export interface CompanyDataDto {
  companyId: string | null;
  companyName: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  domain?: string | null;
  companyLogoUrl?: string | null;
  companyWebsiteUrl?: string | null;
  companyDomain?: string | null;
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
  companyName: string;
}
