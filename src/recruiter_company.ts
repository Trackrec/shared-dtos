import { RecruiterProjectDto } from './recruiter_project.dto';
import { UserDto } from './user.dto';

export interface RecruiterCompanyDto {
  id: number;
  companyName: string;
  logo: string;
  logoType: string;
  /**
   * The company's brand, set by an admin in Settings. Tier 2 of recruiter
   * branding. Each is null until filled in; an empty string on write clears it.
   */
  /** Stored normalised to https://, so "gong.io" arrives as "https://gong.io". */
  websiteUrl: string | null;
  /** One line under the company name. At most 140 characters, no dashes. */
  tagline: string | null;
  /** #RRGGBB, upper case, with a relative luminance of at most 0.85 so white text reads on it. */
  accentColor: string | null;
  recruiters: RecruiterCompanyUserDto[];
  projects: RecruiterProjectDto[];
  createdBy: UserDto | null;
}

export interface RecruiterCompanyUserDto {
  id: number;
  user: UserDto;
  company: RecruiterCompanyDto;
}

/**
 * The three brand fields as a client sends them. Each is optional: absent
 * leaves the stored value alone, an empty string or null clears it. The API
 * normalises the website to https:// and refuses a tagline with a dash or an
 * accent too light for white text, each with a sentence the form can show.
 */
export interface RecruiterCompanyBrandRequestDto {
  websiteUrl?: string | null;
  tagline?: string | null;
  accentColor?: string | null;
}

export interface CreateRecruiterCompanyRequestDto extends RecruiterCompanyBrandRequestDto {
  companyName: string;
}

export interface UpdateRecruiterCompanyRequestDto extends RecruiterCompanyBrandRequestDto {
  companyName?: string;
}

export interface RecruiterCompanyParamDto {
  id: number;
}
