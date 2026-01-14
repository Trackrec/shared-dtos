import { CityDto } from './city.dto';
import { CompanyDto } from './company.dto';
import { PositionDto, VerifyPositionDto } from './position.dto';
import { RecruiterCompanyDto } from './recruiter_company';

export enum LocationPreference {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

export enum UserRole {
  APPLICANT = 'Applicant',
  ADMIN = 'Admin',
  USER = 'User',
  SUPER_ADMIN = 'Super-Admin',
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
  nextRoleLocation: string | null; //TODO: to be removed
  nextRoleCity: CityDto | null;
  nextRoleCityId: number | null;
  oteMin: number | null;
  oteMax: number | null;
  estimatedOteLow: number | null;
  estimatedOteMid: number | null;
  estimatedOteHigh: number | null;
  estimatedOteCurrency: string | null;
  estimatedOteDetails: {
    role?: string;
    baseline?: {
      amount?: number;
      tier?: string;
      multiplier?: number;
      finalAmount?: number;
    };
    compensationSplit?: {
      base?: number;
      variable?: number;
      total?: number;
    };
    modifiers?: Array<{
      type?: string;
      impact?: number;
      description?: string;
    }>;
    finalOte?: {
      amount?: number;
      currency?: string;
      confidence?: string;
      band?: string;
    };
    calculationDate?: string;
  } | null;
  locationPreferences: LocationPreference[];
  password: string | null;
  otp: boolean;
  isPreferencesSave: boolean;
  isWelcome: boolean;
  role: UserRole;
  username: string | null;
  city: string | null; //TODO: to be removed
  cityPlaceId: string | null; //TODO: to be removed
  locationCityId: number | null;
  locationCity: CityDto | null;
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
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  positions: PositionDto[];
  isCompensated: boolean;
  growsurfParticipantId: string | null;
  referredByCode: string | null;
  /**
   * Total relevant work experience across all positions
   * @example "5y, 3m" or "N/A"
   */
  totalYearsExperience?: string;
  /**
   * Total individual contributor experience (non-management roles only)
   * @example "3y, 6m" or "N/A"
   */
  totalIndividualContributorExperience?: string;
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
  email?: string;
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
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
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
  completedPositions: number;
  totalYearsExperience: string;
  totalBdrExperience: string;
  totalLeadershipExperience: string;
  totalIndividualContributorExperience: string;
  oteEstimate?: {
    ote_low: number;
    ote_mid: number;
    ote_high: number;
    ote_currency: string;
  };
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
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
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
  totalOtherExperience?: string;
  totalBdrExperience?: string;
  totalLeadershipExperience?: string;
  totalIndividualContributorExperience?: string;
  weightedAverageExistingBusiness?: number;
  weightedAverageNewBusiness?: number;
  weightedAveragePartnershipBusiness?: number;
  softwareProductTypeAverage?: number;
  hardwareProductTypeAverage?: number;
  serviceProductTypeAverage?: number;
  outboundAverage?: number;
  inboundAverage?: number;
  smbAverage?: number;
  midmarketAverage?: number;
  enterpriseAverage?: number;
  groupPositions?: ExtendedPositionDto[];
  positions: ExtendedPositionDto[];
  pendingVerificationRequests?: number;
  profileViewsCount?: number;
}

export interface ProfileViewsResponseDto {
  error: boolean;
  message?: string;
  views?: AnalyticsAccessDto[];
}

export interface RecruiterAnalyticsAccessDto {
  id: number;
  type: string;
  user: Pick<UserDto, 'id' | 'username' | 'publicProfileUsername' | 'profileImage' | 'fullName'>;
  createdAt: Date;
  updatedAt: Date;
}
export interface RecruiterViewsResponseDto {
  error: boolean;
  message?: string;
  views?: RecruiterAnalyticsAccessDto[];
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
  city: string; //TODO: to be removed
  cityPlaceId: string; //TODO: to be removed
  locationCityId: number | null;
  locationCity: CityDto | null;
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
  nextRoleLocation?: string | null; //TODO: to be removed
  nextRoleLocationPlaceId?: string | null; //TODO: to be removed
  nextRoleCity: CityDto | null;
  nextRoleCityId: number | null;
  resumeParsedData?: ParsedResume | null;
  isImportIndustries?: boolean;
}

export interface ParsedResume {
  currentRole: string;
  workExperience: {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description?: string;
    roleType: string;
    dealSize?: {
      low?: number;
      average?: number;
      high?: number;
    };

    salesCycle?: {
      low?: { value: number; duration: string };
      average?: { value: number; duration: string };
      high?: { value: number; duration: string };
    };

    channelSplit?: {
      inbound: number; // 0–100
      outbound: number; // 0–100 (sum = 100)
    };

    segmentSplit?: {
      smb: number; // 0–100
      midMarket: number; // 0–100
      enterprise: number; // 0–100 (sum = 100)
    };

    notableClients?: string[];
    industry?: string;
    soldToIndustry?: string;
    personas?: string[];
    quotaAchievements?: number;
  }[];

  skills: string[];
  location: {
    country: string;
    region: {
      state: string;
      city: string;
    };
  };
  languages: string[];
  about: string;
  desiredRoles: string[];
  phone: string;
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
