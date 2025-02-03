import { CompanyDto } from './company.dto';
import { PositionDto, VerifyPositionDto } from './position.dto';
import { RecruiterCompanyDto } from './recruiter_company';

export enum LocationPreference {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}
export interface UserDto {
  id: number;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  profile_image: string | null;
  custom_current_role: string | null;
  published_at: Date | null;
  has_avatar: boolean | null;
  isFirstExperienceMailSent: boolean;
  is_checklist_open: boolean;
  blocked: boolean;
  open_to_work: boolean;
  linkedin_access_token: string | null;
  ote_expectation: number | null;
  preference_step: number;
  is_deleted: boolean;
  current_ote: number | null;
  next_role_location: string | null;
  ote_min: number | null;
  ote_max: number | null;
  location_preferences: LocationPreference[];
  password: string | null;
  otp: boolean;
  is_preferences_save: boolean;
  is_welcome: boolean;
  role: string;
  username: string | null;
  city: string | null;
  public_profile_username: string | null;
  languages: string[] | null;
  currency: string | null;
  currency_country: string | null;
  next_desired_titles: string[] | null;
  isExperienceImported: boolean;
  about: string | null;
  created_at: Date;
  updated_at: Date;
  last_accessed_at: Date | null;
  login_method: string | null;
  // positions: PositionDto[];
  // keywords: KeywordsDto | null;
  // analyticsAccess: AnalyticsAccessDto[];
  // projects: AccountProjectDto[];
  // applications: ProjectApplicationDto[];
  // companyCreated: RecruiterCompanyDto | null;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  positions: PositionDto[];
}

export interface RecruiterUserAuthRequestDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface RecruiterUserAuthResponseDto {
  error: boolean;
  message?: string;
  token?: string;
}

export interface UserInfoResponseDto {
  error: boolean;
  message?: string;
  userDetails?: {
    user: UserDto;
    company: RecruiterCompanyDto;
  };
}

export interface ChangePasswordRequestDto {
  current_password: string;
  new_password: string;
}

export interface VerifyTokenResponse {
  error: boolean;
  message?: string;
  token?: string;
}

export interface AllUsersDto {
  error: boolean;
  message?: string;
  data?: UserDto[];
}

export interface IndividualUserDetailsDto {
  error: boolean;
  message?: string;
  user?: UserDto;
}

export interface ExtendedUserDto extends UserDto {
  imported_positions: number;
  npm: boolean;
  total_revenue: number;
  total_years_experience: string;
  total_bdr_experience: string;
  total_leadership_experience: string;
  total_individual_contributor_experience: string;
}

export interface GetUserDetailsResponseDto {
  error: boolean;
  message?: string;
  user?: ExtendedUserDto;
}

export interface CompaniesListDto {
  error: boolean;
  message?: string;
  data?: CompanyDto[];
}

export interface AdminBlockRequestDto {
  block_status: boolean | null;
  user_id: number;
}

export interface ImpersonateUserRequestDto {
  email: string;
  user_id: number;
  username: string;
}

export interface DeleteUserRequestDto {
  user_id: number;
}

export interface GetInTouchMailRequestDto {
  email: string;
  email_to: string;
  inquiry: string;
  name: string;
  phone: string;
}
export interface AnalyticsAccessDto {
  id: number;
  type: string;
  accountVisitor: AccountsVisitorsDto;
  user: UserDto;
  created_at: Date;
  updated_at: Date;
}

export interface AccountsVisitorsDto {
  id: number;
  email: string;
  full_name: string;
  username: string | null;
  linkedin_access_token: string;
  analyticsAccess: AnalyticsAccessDto[];
  created_at: Date;
  updated_at: Date;
}

export interface ExtendedPositionDto extends PositionDto {
  is_completed?: boolean;
  completion_percentage?: number;
  verify_request: VerifyPositionDto[]; // Updated verify requests with enriched user details
}

export interface ExtendedUserDetailsDto extends UserDto {
  total_revenue?: number;
  total_years_experience?: string;
  total_bdr_experience?: string;
  total_leadership_experience?: string;
  total_individual_contributor_experience?: string;
  weightedAverageExistingBusiness?: number;
  weightedAverageNewBusiness?: number;
  weightedAveragePartnershipBusiness?: number;
  outbound_average?: number;
  inbound_average?: number;
  smb_average?: number;
  midmarket_average?: number;
  enterprise_average?: number;
  groupPositions?: ExtendedPositionDto[];
  positions: ExtendedPositionDto[];
}

export interface ProfileViewsResponseDto {
  error: boolean;
  message?: string;
  views?: AnalyticsAccessDto[];
}

export interface InviteUserRequestDto {
  email: string;
  full_name: string;
  role: string;
}

export interface FormattedUserDto extends Omit<UserDto, 'password' | 'linkedin_access_token'> {
  id: number;
}

export interface UsersInCompanyResponseDto {
  error: boolean;
  message?: string;
  users?: FormattedUserDto[];
}

export interface UpdatePreferencesRequestDto {
  about: string | null;
  city: string;
  city_place_id: string;
  currency: string;
  currency_country: string;
  current_ote: number | null;
  custom_current_role: string | null;
  email: string;
  full_name: string;
  languages: string[];
  location_preferences: string[];
  next_desired_titles: string[];
  open_to_work: boolean;
  ote_expectation: number | null;
  ote_max: number | null;
  ote_min: number | null;
  phone: string | null;
  public_profile_username: string | null;
  published_at: string | null;
  is_preferences_save?: boolean;
  preference_step?: number;
  is_welcome?: boolean;
}

export interface GetMeResponseDto {
  error: boolean;
  user?: ExtendedUserDetailsDto;
  message?: string;
  userDetails?: ExtendedUserDetailsDto;
}

export interface PublishProfileParamDto {
  userId: number;
}

export interface PrivateProfileParamDto {
  userId: number;
}

export interface GetPublicProfileParamDto {
  userName: string;
}

export interface RecruiterUserParamDto {
  id: number;
}

export interface ApplicantUserParamDto {
  id: number;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface VerifyTokenRequestDto {
  token: string;
}

export interface ResetPasswordRequestDto {
  new_password: string;
}

export interface GetUserDetailsParamDto {
  userId: number;
}

export interface CreateUpdateKeywordRequestDto {
  keywords: string[];
}

export interface UserParamDto {
  userId: number;
}
