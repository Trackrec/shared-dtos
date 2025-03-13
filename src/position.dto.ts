import { CompanyDto } from './company.dto';
import { PositionDetailsDto } from './position_detail.dto';
import { UserDto } from './user.dto';

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

export interface VerifyPositionDto {
  id: number;
  email: string;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  requestBy: UserDto;
  position: PositionDto;
  user: UserDto | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
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
  status: string;
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
