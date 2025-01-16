import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectVisitors } from './project_visits.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
import { CreateProjectVisitorRequestDto, ProjectVisitorsDto } from 'src/shared-dtos/src/recruiter_project.dto';

@Injectable()
export class ProjectVisitorsService {
  private readonly logger = new Logger(ProjectVisitorsService.name);

  constructor(
    @InjectRepository(ProjectVisitors)
    private readonly projectVisitorsRepository: Repository<ProjectVisitors>,
    @InjectRepository(UserAccounts)
    private readonly accountsUserRepository: Repository<UserAccounts>,
    @InjectRepository(RecruiterProject)
    private readonly accountsProjectRepository: Repository<RecruiterProject>,
  ) {}

  async create(projectVisitorsData: CreateProjectVisitorRequestDto, user_id: number): Promise<ProjectVisitorsDto> {
    this.logger.log(`Attempting to create a project visitor for user ID: ${user_id} and project ID: ${projectVisitorsData.project_id}`);

    const user: UserAccounts = await this.accountsUserRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      this.logger.warn(`User with ID ${user_id} not found.`);
      throw new Error('User not found');
    }

    const project: RecruiterProject = await this.accountsProjectRepository.findOne({
      where: { id: projectVisitorsData.project_id },
    });

    if (!project) {
      this.logger.warn(`Project with ID ${projectVisitorsData.project_id} not found.`);
      throw new Error('Project not found');
    }

    const existing_visitor: ProjectVisitorsDto = await this.projectVisitorsRepository.findOne({
      where: {
        project: { id: projectVisitorsData.project_id },
        user: { id: user_id },
      },
    });

    if (existing_visitor) {
      this.logger.warn(`Visitor already exists for user ID: ${user_id} and project ID: ${projectVisitorsData.project_id}`);
      throw new Error('Visitor already exist');
    }

    const project_visitors: ProjectVisitors = new ProjectVisitors();

    project_visitors.project = project;
    project_visitors.user = user;

    await this.projectVisitorsRepository.save(project_visitors);

    this.logger.log(`Successfully created project visitor for user ID: ${user_id} and project ID: ${projectVisitorsData.project_id}`);
    
    return project_visitors;
  }

  async getProjectVisitors(projectId: number): Promise<number> {
    this.logger.log(`Fetching visitor count for project ID: ${projectId}`);

    const project: RecruiterProject = await this.accountsProjectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.warn(`Project with ID ${projectId} not found.`);
      throw new Error('Project not found');
    }

    const visitorCount: number = await this.projectVisitorsRepository.count({
      where: { project: { id: projectId } },
    });

    this.logger.log(`Visitor count for project ID ${projectId}: ${visitorCount}`);
    
    return visitorCount;
  }
}
