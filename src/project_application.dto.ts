import { PositionDto } from './position.dto';
import { RecruiterProjectDto } from './recruiter_project.dto';
import { UserDto } from './user.dto';

export interface ProjectApplicationDto {
  id: number;
  ote: number;
  available: boolean;
  user: UserDto;
  position_id: number | null;
  project: RecruiterProjectDto;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectApplicationRequestDto {
  project_id: number;
  ote: number;
  available: boolean;
  position_id: number;
  city?: string;
  city_place_id?: string;
}

export interface ProjectApplicationWithPostions extends ProjectApplicationDto {
  id: number;
  ote: number;
  available: boolean;
  position_id: number | null;
  project: RecruiterProjectDto;
  created_at: Date;
  updated_at: Date;
  user: UserDto & {
    positions: PositionDto[];
  };
}

export interface PointsDto {
  ote_points?: number;
  worked_in_points?: number;
  sold_to_points?: number;
  segment_points?: number;
  salescycle_points?: number;
  dealsize_points?: number;
  newbusiness_points?: number;
  outbound_points?: number;
  points_for_persona?: number;
  points_for_experience?: number;
}

export interface PointsCalculationDto {
  otepoints: number;
  worked_in_points: number;
  sold_to_points: number;
  segment_points: number;
  salescycle_points: number;
  dealsize_points: number;
  newbusiness_points: number;
  outbound_points: number;
  points_for_persona: number;
  points_for_experience: number;
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
}

export interface MyApplicationsListDto {
  error: boolean;
  message?: string;
  applications?: ProjectApplicationDto[];
}
