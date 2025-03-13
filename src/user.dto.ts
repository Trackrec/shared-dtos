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
  fullName: string | null;
  profileImage: string | null;
  customCurrentRole: string | null;
  publishedAt: Date | null;
  hasAvatar: boolean | null;
  isFirstExperienceMailSent: boolean;
  isChecklistOpen: boolean;
  blocked: boolean;
  openToWork: boolean;
  oteExpectation: number | null;
  preferenceStep: number;
  isDeleted: boolean;
  currentOte: number | null;
  nextRoleLocation: string | null;
  oteMin: number | null;
  oteMax: number | null;
  locationPreferences: LocationPreference[];
  password: string | null;
  otp: boolean;
  isPreferencesSave: boolean;
  isWelcome: boolean;
  role: string;
  username: string | null;
  city: string | null;
  publicProfileUsername: string | null;
  languages: string[] | null;
  currency: string | null;
  currencyCountry: string | null;
  nextDesiredTitles: string[] | null;
  isExperienceImported: boolean;
  about: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;
  loginMethod: string | null;
  // positions: PositionDto[];
  // keywords: KeywordsDto | null;
  // analyticsAccess: AnalyticsAccessDto[];
  // projects: AccountProjectDto[];
  // applications: ProjectApplicationDto[];
  // companyCreated: RecruiterCompanyDto | null;
  resetPasswordExpires: Date | null;
  positions: PositionDto[];
}
export interface RecruiterUserAuthRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
  currentPassword: string;
  newPassword: string;
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
  importedPositions: number;
  npm: boolean;
  totalRevenue: number;
  totalYearsExperience: string;
  totalBdrExperience: string;
  totalLeadershipExperience: string;
  totalIndividualContributorExperience: string;
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
  blockStatus: boolean | null;
  userId: number;
}

export interface ImpersonateUserRequestDto {
  email: string;
  userId: number;
  username: string;
}

export interface DeleteUserRequestDto {
  userId: number;
}

export interface GetInTouchMailRequestDto {
  email: string;
  emailTo: string;
  inquiry: string;
  name: string;
  phone: string;
}

export interface AnalyticsAccessDto {
  id: number;
  type: string;
  accountVisitor: AccountsVisitorsDto;
  user: UserDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountsVisitorsDto {
  id: number;
  email: string;
  fullName: string;
  username: string | null;
  analyticsAccess: AnalyticsAccessDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtendedPositionDto extends PositionDto {
  isCompleted?: boolean;
  completionPercentage?: number;
  verifyRequest: VerifyPositionDto[]; // Updated verify requests with enriched user details
}

export interface ExtendedUserDetailsDto extends UserDto {
  totalRevenue?: number;
  totalYearsExperience?: string;
  totalBdrExperience?: string;
  totalLeadershipExperience?: string;
  totalIndividualContributorExperience?: string;
  weightedAverageExistingBusiness?: number;
  weightedAverageNewBusiness?: number;
  weightedAveragePartnershipBusiness?: number;
  outboundAverage?: number;
  inboundAverage?: number;
  smbAverage?: number;
  midmarketAverage?: number;
  enterpriseAverage?: number;
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
  fullName: string;
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
  cityPlaceId: string;
  currency: string;
  currencyCountry: string;
  currentOte: number | null;
  customCurrentRole: string | null;
  email: string;
  fullName: string;
  languages: string[];
  locationPreferences: string[];
  nextDesiredTitles: string[];
  openToWork: boolean;
  oteExpectation: number | null;
  oteMax: number | null;
  oteMin: number | null;
  phone: string | null;
  publicProfileUsername: string | null;
  publishedAt: string | null;
  isPreferencesSave?: boolean;
  preferenceStep?: number;
  isWelcome?: boolean;
  nextRoleLocation?: string | null;
  nextRoleLocationPlaceId?: string | null;
}

export interface GetMeResponseDto {
  error?: boolean;
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
  newPassword: string;
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
