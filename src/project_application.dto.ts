import { PositionDto } from './position.dto';
import { RecruiterProjectDto } from './recruiter_project.dto';
import { UserDto } from './user.dto';

export interface ProjectApplicationDto {
  id: number;
  ote: number;
  available: boolean;
  user: UserDto;
  positionId: number | null;
  project: RecruiterProjectDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectApplicationRequestDto {
  projectId: number;
  ote: number;
  oteFrom: number;
  available: boolean;
  positionId: number;
  city?: string;
  locationCityId?: number;
  currency: string;
  currencyCountry: string;
  willingToRelocate?: boolean;
}

export interface ProjectApplicationWithPostions extends ProjectApplicationDto {
  id: number;
  ote: number;
  available: boolean;
  willingToRelocate: boolean;
  positionId: number | null;
  project: RecruiterProjectDto;
  currency: string;
  /**
   * The currency by NAME, e.g. "Canadian Dollar (CAD)", as chosen in the apply
   * dialog. Distinct from `currency`, which is the display SYMBOL and is
   * ambiguous: the Mexican Peso's symbol is "$", exactly like the US Dollar.
   *
   * The column has existed on the application entity and been written by
   * application.service all along, and this interface not declaring it is why it
   * was read nowhere: the scorer could not reach it, so it fell back to the
   * USER's country while using the APPLICATION's amount. A Barney-onboarded
   * candidate, whose user row never gets this field, was therefore scored as USD
   * whatever they picked, and a 300k CAD expectation read as 300k USD against
   * the job's band.
   *
   * Nullable for rows written before the column was populated.
   */
  currencyCountry: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: UserDto & {
    positions: PositionDto[];
  };
}

export interface ProjectWithUserPostions {
  project: RecruiterProjectDto;
  user: UserDto & {
    positions: PositionDto[];
  };
}

export interface PointsDto {
  otePoints?: number;
  workedInPoints?: number;
  soldToPoints?: number;
  segmentPoints?: number;
  salesCyclePoints?: number;
  dealSizePoints?: number;
  newBusinessPoints?: number;
  outboundPoints?: number;
  pointsForPersona?: number;
  pointsForExperience?: number;
  pointsForTerritory?: number;
  pointsForLocation?: number;
  pointsForCompanyOverlap?: number;
  pointsForProductType?: number;
}

export interface PointsCalculationDto {
  otePoints: number;
  workedInPoints: number;
  soldToPoints: number;
  segmentPoints: number;
  salesCyclePoints: number;
  dealSizePoints: number;
  newBusinessPoints: number;
  outboundPoints: number;
  pointsForPersona: number;
  pointsForExperience: number;
  pointsForTerritory: number;
  pointsForLocation: number;
  pointsForCompanyOverlap: number;
}

export interface ProjectApplicationWithUserPointsDto extends ProjectApplicationWithPostions {
  user: UserDto & {
    points: {
      points: PointsDto;
      percentage: number;
    };
  };
}

export interface ApplicationRankingListResponseDto {
  error: boolean;
  message?: string;
  updatedApplicationsWithUserPoints?: ProjectApplicationWithUserPointsDto[];
  above75Count?: number;
  visitorCount?: number;
  project?: RecruiterProjectDto;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface MyApplicationsListDto {
  error: boolean;
  message?: string;
  applications?: ProjectApplicationDto[];
}
