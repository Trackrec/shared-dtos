import { RecruiterProjectDto } from "./recruiter_project.dto";
import { UserDto } from "./user.dto";

export interface ProjectVisitorsDto {
    id: number; 
    project: RecruiterProjectDto;
    user: UserDto;
  }
  