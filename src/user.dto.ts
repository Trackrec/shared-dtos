import { CityDto } from './city.dto';
import { CompanyDto } from './company.dto';
import { PositionDto, VerifyPositionDto } from './position.dto';
import { RecruiterCompanyDto } from './recruiter_company';
import { OteEstimationDetailsDto } from './ote-estimation-details.dto';

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

export enum JobHopperStatus {
  STABLE = 'STABLE',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export interface UserDto {
  id: number;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  profileImage: string | null;
  customCurrentRole: string | null;
  publishedAt: Date | null;
  /**
   * Does reading this published profile require a login?
   *
   * The third visibility tier, beside publishedAt rather than replacing it,
   * because thirty-five places across the two repos read that column.
   * publishedAt still answers "is this published"; this answers "does a reader
   * have to sign in".
   *
   *   private  publishedAt null
   *   public   publishedAt set, openWithoutLogin false
   *   open     publishedAt set, openWithoutLogin true
   *
   * With no login there is no viewer, so an open profile cannot tell its owner
   * who read it and cannot hide from their employer. That is the trade, and the
   * visibility control has to say so before somebody picks it.
   */
  openWithoutLogin: boolean;
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
  estimatedOteDetails: OteEstimationDetailsDto | null;
  estimatedOteUpdatedAt: Date | null;
  locationPreferences: LocationPreference[];
  password: string | null;
  otp: boolean;
  isPreferencesSave: boolean;
  isWelcome: boolean;
  role: UserRole;
  username: string | null;
  city: string | null; //TODO: to be removed
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
  /**
   * Job hopper status badge level
   * @example "STABLE" | "YELLOW" | "RED"
   */
  jobHopperStatus?: JobHopperStatus;
  /**
   * Explanation for job hopper status
   * @example "3 roles under 12mo in last 3 years"
   */
  jobHopperExplanation?: string;
  /**
   * Number of short stints (< 12 months) in last 3 years
   * @example 2
   */
  shortStintsCount?: number;
  /**
   * Current role tenure in months
   * @example 8
   */
  currentTenureMonths?: number;
  totalJobs?: number;
  publishedJobs?: number;
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
  /** Who the enquiry is for. Preferred over emailTo when present. */
  profileUserId?: number;
  /** The older identifier. Still honoured, so either half can deploy first. */
  emailTo?: string | null;
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

/**
 * One requirement counting toward a position reaching 100% completion.
 *
 * Completion is all-or-nothing: a job posting captures the same field set as a position and
 * matching compares them field by field, so anything short of 100% cannot be matched. The
 * UI therefore needs to name the outstanding fields, not just show a percentage.
 */
export interface CompletionRequirementDto {
  /** Stable identifier, e.g. `details.averageDealSize`. Safe to key or deep-link on. */
  key: string;
  /** User-facing label, phrased as the thing being asked for. */
  label: string;
  filled: boolean;
}

export interface ExtendedPositionDto extends PositionDto {
  isCompleted?: boolean;
  completionPercentage?: number;
  /** Requirements still outstanding for this position. Empty when `isCompleted` is true. */
  missingFields?: CompletionRequirementDto[];
  verifyRequest: VerifyPositionDto[]; // Updated verify requests with enriched user details
}

export interface GroupedPositionDto {
  totalExperience: string;
  company: CompanyDto;
  positions: ExtendedPositionDto[];
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
  groupPositions?: GroupedPositionDto[];
  positions: ExtendedPositionDto[];
  pendingVerificationRequests?: number;
  profileViewsCount?: number;
  hiddenExperienceCount?: number;
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

/**
 * The published-profile response, at /p/:username.
 *
 * A SEPARATE TYPE ON PURPOSE, not a Pick of ExtendedUserDetailsDto.
 *
 * The leak this replaces existed partly because the type constrained nothing:
 * ExtendedUserDetailsDto is an interface, so it is erased at runtime, and the
 * service spread the whole entity into it. Every column added to UserAccounts
 * since then rode along - the owner's email and phone, the parsed resume, `otp`,
 * `lastAccessedAt`, the impersonable referral code - and no type ever objected.
 *
 * A Pick<> would inherit that problem in a quieter form: widen the source and the
 * Pick widens with it. Spelling the fields out means a new column is invisible
 * here until somebody adds it, and the compiler asks the question at the point
 * where the answer matters.
 *
 * NO `positions`. The flat array was a second copy of every position and
 * therefore of every verification request, and nothing on this path reads it: the
 * card list flattens groupPositions itself. Required on ExtendedUserDetailsDto,
 * which is the other reason this cannot be that type.
 */
export interface PublicVerifierDto {
  fullName: string | null;
  profileImage: string | null;
  username: string | null;
}

/**
 * One verification request, as a viewer of a profile may see it.
 *
 * Absent by design: `email`, the working contact address of a third party who
 * published nothing; `uniqueToken`, a bcrypt hash of the one-click approval
 * token; `snapshotJson` and `snapshotHash`, the position's values frozen at
 * sign-off, which where the state is MODIFIED say exactly what changed
 * afterwards; and `id`, which is useful only for probing.
 */
export interface PublicVerifyRequestDto {
  status: string;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  updatedAt: Date | null;
  verificationState: string | null;
  /** Null, not absent, when the verifier has no TrackRec account. */
  user: PublicVerifierDto | null;
}

/**
 * A company, as a viewer of a profile may see it: public identity only.
 *
 * Absent by design: `companyId` (Apollo's own org id), `apolloKeywords`,
 * `apolloIndustries`, `enrichmentAttempts`, `enrichedAt`, `headcountRefreshedAt`,
 * `employeeCount1yrAgo` and the enrichment status. That is data TrackRec pays
 * for, and none of it is rendered.
 */
export interface PublicCompanyDto {
  id: number;
  name: string | null;
  domain: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  apolloDescription: string | null;
  apolloIndustry: string | null;
  currentEmployeeCount: number | null;
  yoyGrowthPercentage: string | null;
}

/** The whitelisted owner fields. No email, no phone, no resume, no internal state. */
export interface PublicProfileUserDto {
  id: number;
  fullName: string | null;
  profileImage: string | null;
  customCurrentRole: string | null;
  city: string | null;
  languages: string[] | null;
  username: string | null;
  publicProfileUsername: string | null;
  publishedAt: Date | null;
  openToWork: boolean | null;
  about: string | null;
  nextDesiredTitles: string[] | null;
  locationPreferences: string[] | null;
  oteMin: number | null;
  oteMax: number | null;
  currency: string | null;
}

export interface PublicProfileDto extends PublicProfileUserDto {
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
  /** The only position source on this path. */
  groupPositions?: unknown[];
}

/**
 * A position as it appears on a published profile.
 *
 * The position and its details are unchanged from the wide DTO: both were read
 * column by column and carry nothing sensitive. What is narrowed is what hangs
 * off them - the company row and the verification requests - so this type exists
 * to make the compiler check that neither is widened back.
 *
 * `details` stays loose because the profile page reads roughly thirty fields off
 * it and every one is a sales metric the owner published on purpose.
 */
export interface PublicProfilePositionDto {
  id: number;
  role: string | null;
  startMonth: number | null;
  startYear: number | null;
  endMonth: number | null;
  endYear: number | null;
  /** Optional: not every position row carries one. */
  source?: string | null;
  isCompleted?: boolean;
  completionPercentage?: number;
  company: PublicCompanyDto | null;
  verifyRequest: PublicVerifyRequestDto[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any;
}
