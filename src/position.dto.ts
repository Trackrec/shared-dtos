import { CompanyDto } from './company.dto';
import { PositionDetailsDto } from './position_detail.dto';
import { UserDto } from './user.dto';
export enum RequestStatus {
  REQUESTED = 'Requested',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  WITHDRAWN = 'Withdrawn',
}
export enum PositionStatus {
  ACTIVE = 'active',
  EXCLUDED = 'excluded',
  /**
   * A placeholder Barney created and nobody has filled in yet: no role, no
   * company, no dates. It exists because the conversation needs something to
   * write answers onto, and it becomes ACTIVE the moment it has a real role.
   *
   * Victoria Lee's profile showed one of these as an experience reading
   * 'NA / Since 126y and 9m', between two real jobs. It was created ACTIVE, so
   * every query that trusts that flag counted an empty row as a job.
   */
  DRAFT = 'draft',
}
export interface PositionDto {
  id: number;
  startMonth: number | null;
  startYear: number | null;
  endMonth: number | null;
  endYear: number | null;
  role: string;
  user: UserDto;
  alternativeBrandIconUrl: string | null;
  company: CompanyDto;
  details: PositionDetailsDto | null;
  verifyRequest: VerifyPositionDto[];
  status: PositionStatus;
}

export interface PositionRequestDto {
  companyId: string;
  companyName: string;
  endMonth: number;
  endYear: number;
  startMonth: number;
  startYear: number;
  logoUrl: string | null;
  role: string;
  websiteUrl: string | null;
  workingHere: boolean;
  domain: string | null;
  linkedinUrl: string | null;
}

export interface PositionWithCompany {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  role: string;
  user: {
    locationPreferences: string[];
    id: number;
  };
  company: {
    name: string;
    logoUrl: string;
    domain: string | null;
    id: string;
    companyId: string;
  };
  alternativeBrandIconUrl: string | null;
  id: number;
}

export interface RecentYearPositionFilterDto {
  one: number;
  two: number;
  three: number;
  four: number;
  five: number;
  fivePlus: null;
}

/** A value the verifier signed off on: a number, a string, a flag, a list, or nothing. */
export type VerifiedSnapshotValue = string | number | boolean | string[] | null;

/**
 * One value the verifier signed off on, with its key spelled out for a person.
 *
 * `field` is the snapshot key (averageDealSize), `label` is what a reader sees
 * (Deal size). The label is computed server-side so every screen calls the same
 * number the same thing.
 */
export interface VerifiedSnapshotEntry {
  field: string;
  label: string;
  value: VerifiedSnapshotValue;
}

/** One field that has moved since the sign-off, however little. */
export interface VerificationChange {
  field: string;
  label: string;
  verified: VerifiedSnapshotValue;
  current: VerifiedSnapshotValue;
}

/**
 * What an approved verification is worth today, and the evidence behind it.
 *
 * verificationState  VERIFIED, MODIFIED or LEGACY. VERIFIED can carry a
 *                    non-empty `changes`: a number drifted but stayed inside
 *                    the tolerance, so the badge stands and the verified figures
 *                    are shown quietly beside it.
 * verifiedSnapshot   the values the verifier signed off on, or null when the
 *                    approval predates snapshots. On a pending request it is
 *                    what the verifier is being asked to vouch for.
 * changes            every field that moved since, with both values, so a
 *                    reader can see the verified version and the difference.
 */
export interface VerificationOutcomeDto {
  verificationState: string | null;
  verifiedSnapshot: VerifiedSnapshotEntry[] | null;
  changes: VerificationChange[];
}

export interface VerifyPositionDto {
  id: number;
  email: string;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  requestBy: UserDto;
  position: PositionDto;
  user: UserDto | null;
  uniqueToken: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  snapshotJson: any;
  snapshotHash: string;
  verificationState?: string;
  /** See VerificationOutcomeDto. Present on approved and pending requests. */
  verifiedSnapshot?: VerifiedSnapshotEntry[] | null;
  changes?: VerificationChange[];
}

export interface VerifyPositionRequestDto {
  email: string;
  firstName: string;
  lastName: string;
  positionId: number;
  requestBy: number;
  role: string;
}

export interface ResendPositionVerificationEmailRequestDto {
  requestId: number;
}

export interface ChangeVerificationRequestDto {
  requestId: number;
  status: RequestStatus;
}

export interface ExtendedVerifyPositionDto extends VerifyPositionDto {
  position: {
    isCompleted: boolean;
    completionPercentage: number;
  } & PositionDto;
}

export interface VerifyRequestsResponseDto {
  error: boolean;
  message?: string;
  requests?: ExtendedVerifyPositionDto[];
}

export interface UpdateUserIdRequestDto {
  requestToken: string;
}

export interface DeleteVerificationDto {
  requestId: number;
}

export interface PostionResponseDto {
  error: boolean;
  message?: string;
  position?: PositionDto;
}

export interface AllPositionsByUserIdResponseDto {
  error: boolean;
  message?: string;
  positions?: PositionDto[];
}

export interface PositionParamDto {
  id: number;
}
