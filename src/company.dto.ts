import { PositionDto } from "./Position.dto";

export interface CompanyDto {
    id: string; 
    name: string;
    company_id: string | null;
    domain: string | null;
    logo_url: string | null;
    website_url: string | null;
    created_at: Date;
    updated_at: Date;
    positions: PositionDto[]; 
  }
  
export interface CompanyDataDto{
    company_id: string | null,
    company_name: string,
    logo_url?: string | null,
    website_url?: string | null,
    domain?: string | null,
    company_logo_url?: string | null,
    company_website_url?: string | null,
    company_domain?: string | null
}

export interface CompanyCreateResponseDto {
  error: boolean;
  message?: string;
  createdCompany?: CompanyDto;
}

export interface CompaniesListDto{
  error: boolean;
  message?: string;
  companies?: CompanyDto[]

}

export interface CompanyUpdateResponseDto {
  error: boolean;
  message?: string;
  updatedCompany?: CompanyDto;
}

export interface CompanyByIdDto{
  error: boolean;
  message?: string;
  company?: CompanyDto
}