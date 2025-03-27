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
  available: boolean;
  positionId: number;
  city?: string;
  cityPlaceId?: string;
}

export interface ProjectApplicationWithPostions extends ProjectApplicationDto {
  id: number;
  ote: number;
  available: boolean;
  positionId: number | null;
  project: RecruiterProjectDto;
  createdAt: Date;
  updatedAt: Date;
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
